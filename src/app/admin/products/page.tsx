"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Menu, Search as SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProductForm from "../../components/ProductForm";
import { Product, getProducts, createProduct, updateProduct,deleteProduct } from "@/lib/api";

/**
 * Small helper to decode JWT payload without external deps.
 * Returns payload object or null.
 */
function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function AdminProductsPage() {
  const router = useRouter();

  // --- Auth state (must be top-level hook) ---
  const [isSuperuser, setIsSuperuser] = useState<boolean | null>(null);

  // --- Layout / UI state ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "update">("add");
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // --- Data state ---
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  // --- Search & Pagination ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // --- Loading / errors ---
  const [listLoading, setListLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);

  // --- Abort controller ref for fetch cancellation ---
  const abortRef = useRef<AbortController | null>(null);

  // ---------- Effects (all declared after hooks) ----------

  // Detect mobile once and on resize
  useEffect(() => {
    const handle = () => setIsMobile(typeof window !== "undefined" ? window.innerWidth < 768 : false);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // Determine superuser status:
  // 1) prefer localStorage.is_superuser
  // 2) fallback to decoding accessToken payload if available
  useEffect(() => {
    const flag = localStorage.getItem("is_superuser");
    if (flag === "true") {
      setIsSuperuser(true);
      return;
    }
    if (flag === "false") {
      setIsSuperuser(false);
      return;
    }

    // try decoding token payload
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // no token -> not allowed (will redirect below)
      setIsSuperuser(false);
      return;
    }

    const payload = parseJwt(token);
    if (payload && typeof payload.is_superuser !== "undefined") {
      const val = !!payload.is_superuser;
      localStorage.setItem("is_superuser", val ? "true" : "false");
      setIsSuperuser(val);
    } else {
      // fallback: not superuser
      setIsSuperuser(false);
    }
  }, []);

  // Redirect non-superusers to /dashboard (only after we know the flag)
  useEffect(() => {
    if (isSuperuser === false) {
      // replace so user can't go back to admin page in history
      router.replace("/dashboard");
    }
  }, [isSuperuser, router]);

  // Debounce the search input (100ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(id);
  }, [search]);

  // Fetch product list when search/page/rows change — only if superuser
  useEffect(() => {
  if (!isSuperuser) return; // don't fetch until we know the user is allowed

  // cancel previous
  abortRef.current?.abort();
  const ac = new AbortController();
  abortRef.current = ac;

  const fetchList = async () => {
    setListLoading(true);
    setError(null);
    try {
      const { results, count } = await getProducts({
        page: currentPage,
        pageSize: rowsPerPage,
        search: debouncedSearch,
        signal: ac.signal,
      });
      setProducts(results);
      setTotalCount(count);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return; // canceled by next request -> ignore
      }

      console.error("❌ Product fetch failed:", err);

      // 🔹 Handle unauthorized
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("is_superuser");
        setError("Session expired. Please log in again.");
        router.replace("/login");
        return;
      }

      setError(err?.message || "Failed to load products");
    } finally {
      setListLoading(false);
    }
  };

  fetchList();

  return () => ac.abort();
}, [debouncedSearch, currentPage, rowsPerPage, isSuperuser, router]);

  // Clamp page when totalCount changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalCount, rowsPerPage, currentPage]);

  // ---------- Optimistic create / update helpers ----------

  const optimisticCreate = async (payload: Partial<Product>) => {
    const tempId = Math.max(1, Date.now()) * -1;
    const optimistic = ({ id: tempId, ...payload } as unknown) as Product;
    setProducts((prev) => [optimistic, ...prev]);
    setTotalCount((c) => c + 1);

    try {
      setFormSubmitting(true);
      const created = await createProduct(payload);
      setProducts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
    } catch (err: any) {
      setProducts((prev) => prev.filter((p) => p.id !== tempId));
      setTotalCount((c) => Math.max(0, c - 1));
      setError(err?.message ?? "Create failed");
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  const optimisticUpdate = async (id: number, payload: Partial<Product>) => {
    const prev = products.find((p) => p.id === id);
    if (!prev) throw new Error("Product not found locally");

    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...payload } : p)));

    try {
      setFormSubmitting(true);
      const updated = await updateProduct(id, payload);
      setProducts((ps) => ps.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      setProducts((ps) => ps.map((p) => (p.id === id ? prev : p)));
      setError(err?.message ?? "Update failed");
      throw err;
    } finally {
      setFormSubmitting(false);
    }
  };

  // ---------- UI helpers ----------

  const openAdd = () => {
    setMode("add");
    setEditProduct(null);
    if (isMobile) {
      router.push("/admin/products/add");
    } else {
      setModalOpen(true);
    }
  };

  const openEdit = (p: Product) => {
    setMode("update");
    setEditProduct(p);
    if (isMobile) {
      router.push(`/admin/products/update/${p.id}`);
    } else {
      setModalOpen(true);
    }
  };

  const onFormSubmit = async (data: any) => {
    setError(null);
    try {
      if (mode === "add") {
        await optimisticCreate(data);
      } else if (mode === "update" && editProduct) {
        await optimisticUpdate(editProduct.id, data);
      }
      setModalOpen(false);
      setEditProduct(null);
    } catch (err) {
      console.error(err);
    }
  };

 const optimisticDelete = async (id: number) => {
  const prev = products;
  setProducts((ps) => ps.filter((p) => p.id !== id));
  setTotalCount((c) => Math.max(0, c - 1));

  try {
    await deleteProduct(id);
  } catch (err: any) {
    console.error("Delete failed:", err);
    setProducts(prev); // rollback
    setTotalCount(prev.length);
    setError(err?.message ?? "Delete failed ❌");
  }
};


  // Pagination values
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(totalCount, (currentPage - 1) * rowsPerPage + products.length);

  // --- Render guard: still checking permissions
  if (isSuperuser === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  // If not superuser, we already triggered a redirect effect; render nothing
  if (!isSuperuser) {
    return null;
  }

  // --- Main UI (superuser only) ---
  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-4 md:p-6">
         {/* Global Error Alert */}
{error && (
  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
    {error}
  </div>
)}

        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <h2 className="text-lg font-bold text-gray-800">Admin - Products</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-200">
            <Menu size={22} />
          </button>
        </div>

        {/* Header (search + add) */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <h3 className="hidden md:block text-xl font-bold text-gray-800">Products (Admin)</h3>

            <div className="flex-1 md:max-w-lg relative">
              <input
                type ="text"
                placeholder="Search by name, generic, or category..."
                value={search}
                onChange={(e) => {setSearch(e.target.value);
                setCurrentPage(1);
                }}
                
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-md transition text-sm"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Add Product</span>
              </button>
            </div>
          </div>

          {/* error or loading */}
          <div className="mt-3">
            {listLoading ? (
              <div className="text-sm text-gray-500">Loading products...</div>
            ) : error ? (
              <div className="text-sm text-red-600">Error: {error}</div>
            ) : (
              <div className="text-sm text-gray-600">
                Showing {startIndex}–{endIndex} of {totalCount}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3 hidden md:table-cell">Generic</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 hidden md:table-cell">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3 hidden md:table-cell">pkt Price</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && !listLoading ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-gray-500">
                      No products found ❌
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 hidden md:table-cell text-gray-600">{(p as any).generic_name ?? "-"}</td>
                      <td className="p-3">{(p as any).category_name}</td>
                      <td className="p-3 hidden md:table-cell">{(p as any).quantity ?? "-"}</td>
                      <td className="p-3">${(p as any).selling_price ?? "-"}</td>
                      <td className="p-3 hidden md:table-cell">${(p as any).pkt_price ?? "-"}</td>
                      <td className="p-3 text-right flex items-center gap-2 justify-end">
  <button
    onClick={() => openEdit(p)}
    className="p-2 rounded-md hover:bg-gray-200"
  >
    <Edit2 size={16} />
  </button>

  <button
    onClick={() => {
      if (confirm(`Delete ${p.name}?`)) optimisticDelete(p.id);
    }}
    className="p-2 rounded-md hover:bg-red-100 text-red-600"
  >
    🗑
  </button>
</td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <label htmlFor="rows" className="text-sm text-gray-600">Rows per page:</label>
              <select
                id="rows"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Prev
              </button>

              {[...Array(Math.max(1, Math.ceil(totalCount / rowsPerPage)))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded-md text-sm ${currentPage === pageNum ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-200"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, Math.max(1, Math.ceil(totalCount / rowsPerPage))))}
                disabled={currentPage === Math.ceil(totalCount / rowsPerPage)}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Showing {totalCount === 0 ? 0 : startIndex}–{endIndex} of {totalCount}
            </div>
          </div>
        </div>
      </div>

      {/* Modal (desktop/tablet only) */}
      {!isMobile && modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
            {/* Sticky top close */}
            <div className="sticky top-0 bg-white p-3 border-b z-20 flex justify-end">
              <button onClick={() => setModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 rounded-full p-2">✖</button>
            </div>

            <div className="p-4 sm:p-6">
             <ProductForm initialData={editProduct || undefined} onSubmit={onFormSubmit} mode={mode} />
  {formSubmitting && <div className="mt-2 text-sm text-gray-600">Saving...</div>}
  {error && <div className="mt-2 text-sm text-red-600">Error: {error}</div>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
