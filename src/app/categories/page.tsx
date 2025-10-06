"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { Plus, Trash2, Edit } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Category {
  id: number;
  name: string;
  description?: string;
}

export default function CategoryPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // 🔹 Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login"); // redirect if not logged in
    } else {
      loadCategories();
    }
  }, [router]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/v1/category/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || res.status === 403) {
          // 🔹 Handle expired/invalid token
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }
        throw new Error(
          errData?.detail || errData?.message || `Error ${res.status}`
        );
      }
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message ?? "Error loading categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    const prev = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/v1/category/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }
        throw new Error(
          errData?.detail || errData?.message || `Error ${res.status}`
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Delete failed");
      setCategories(prev); // rollback
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  async function handleSave(category: Partial<Category>) {
    const token = localStorage.getItem("accessToken");
    try {
      let res;
      if (editingCategory) {
        // Update
        res = await fetch(`${API_URL}/v1/category/${editingCategory.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(category),
        });
      } else {
        // Create
        res = await fetch(`${API_URL}/v1/category/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(category),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }
        throw new Error(
          errData?.detail || errData?.message || `Error ${res.status}`
        );
      }

      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      console.error("Save failed", err);
      setError(err.message ?? "Save failed");
    }
  }

  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Categories</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Add Category
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-gray-600 text-sm">{c.description}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-2 rounded hover:bg-gray-200"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 rounded hover:bg-red-100 text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && !loading && (
          <p className="text-gray-500">No categories found.</p>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </main>
  );
}

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (data: Partial<Category>) => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          {category ? "Edit Category" : "Add Category"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
