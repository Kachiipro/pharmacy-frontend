"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ redirect helper
import { Menu, Search, ChevronDown, ChevronUp } from "lucide-react";
import Sidebar from "../components/Sidebar";

// helper for headers
function authHeaders() {
  const token = localStorage.getItem("accessToken");
  if (!token) return {};
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login"); // redirect to login page
      return;
    }

    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://johncast.pythonanywhere.com/api/v1/goods/", {
          method: "GET",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error("❌ Product fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  // ✅ Your search + pagination stays the same
  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.generic_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const toggleRow = (id: number) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-4 md:p-6">
        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <h2 className="text-lg font-bold text-gray-800">Products</h2>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Search + Table */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <h3 className="hidden md:block text-xl font-bold text-gray-800">
              Products
            </h3>
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search by name, generic, or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center p-4 text-gray-500">Loading...</p>
            ) : (
              <table className="w-full border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3">Name</th>
                    <th className="p-3 hidden md:table-cell">Generic</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 hidden md:table-cell">QTY</th>
                    <th className="p-3 hidden md:table-cell">pkt Price</th>
                    <th className="p-3">unit Price</th>
                    <th className="p-3 md:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((p) => (
                      <>
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3 hidden md:table-cell text-gray-600">
                            {p.generic_name || "-"}
                          </td>
                          <td className="p-3">{p.category_name || "-"}</td>
                          <td className="p-3 hidden md:table-cell">
                            {p.quantity}
                          </td>
                        
                          <td className="p-3 hidden md:table-cell">
                             ₦{p.pkt_price}
                          </td>
                          <td className="p-3"> ₦{p.selling_price}</td>

                          {/* Expand button only on mobile */}
                          <td className="p-3 md:hidden text-right">
                            <button
                              onClick={() => toggleRow(p.id)}
                              className="flex items-center text-blue-600 text-sm"
                            >
                              {expandedRows.includes(p.id) ? (
                                <>
                                  Hide <ChevronUp size={16} className="ml-1" />
                                </>
                              ) : (
                                <>
                                  Details{" "}
                                  <ChevronDown size={16} className="ml-1" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible row for mobile */}
                        {expandedRows.includes(p.id) && (
                          <tr className="md:hidden bg-gray-50">
                            <td colSpan={7} className="p-3 text-gray-700">
                              <div className="space-y-1">
                                <p>
                                  <span className="font-semibold">Generic:</span>{" "}
                                  {p.generic_name || "-"}
                                </p>
                                <p>
                                  <span className="font-semibold">Qty:</span>{" "}
                                  {p.quantity}
                                </p>
                                <p>
                                   <span className="font-semibold">pkt Price:</span>{" "}
                                    ₦{p.pkt_price}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-3 text-center text-gray-500">
                        No products found ❌
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Rows per page:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
