"use client";

import { useEffect, useState } from "react";

interface ProductFormProps {
  mode: "add" | "edit";
  initialData?: any;
  onSubmit: (data: any) => void;
}

export default function ProductForm({
  mode,
  initialData = {},
  onSubmit,
}: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData.name || "",
    generic_name: initialData.generic_name || "",
    category: initialData.category || "",
    pkt_price: initialData.pkt_price || "",
    quantity: initialData.quantity || "",
    selling_price: initialData.selling_price || "",
    cost_price: initialData.cost_price || "",
    expiry_date: initialData.expiry_date || "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ✅ Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/category/`);
        const data = await res.json();

        console.log("Fetched categories:", data); // 🧪 debug

        let extracted: any[] = [];
        if (Array.isArray(data)) {
          extracted = data;
        } else if (Array.isArray(data.results)) {
          extracted = data.results;
        } else if (Array.isArray(data.data)) {
          extracted = data.data;
        }

        setCategories(extracted);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      pkt_price: parseFloat(form.pkt_price) || 0,
      quantity: parseInt(form.quantity) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
    };
    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6 max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-extrabold text-gray-900">
        {mode === "add" ? "➕ Add Luxury Product" : "✏️ Edit Product"}
      </h2>
      <p className="text-gray-500 text-sm">
        Fill in the details below to {mode === "add" ? "create" : "update"} a
        luxury product.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Generic Name */}
        <input
          type="text"
          name="generic_name"
          value={form.generic_name}
          onChange={handleChange}
          placeholder="Generic Name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Category (Dropdown) */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black focus:border-black transition"
        >
          <option value="">Select Category</option>
          {loadingCategories ? (
            <option disabled>Loading...</option>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <option key={cat.id || cat.value} value={cat.id || cat.value}>
                {cat.name || cat.title || cat.label}
              </option>
            ))
          ) : (
            <option disabled>No categories available</option>
          )}
        </select>

        {/* Packet Price */}
        <input
          type="number"
          name="pkt_price"
          value={form.pkt_price}
          onChange={handleChange}
          placeholder="Packet Price"
          step="0.01"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Quantity */}
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Selling Price */}
        <input
          type="number"
          name="selling_price"
          value={form.selling_price}
          onChange={handleChange}
          placeholder="Selling Price"
          step="0.01"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Cost Price */}
        <input
          type="number"
          name="cost_price"
          value={form.cost_price}
          onChange={handleChange}
          placeholder="Cost Price"
          step="0.01"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />

        {/* Expiry Date */}
        <input
          type="date"
          name="expiry_date"
          value={form.expiry_date}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition"
        >
          {mode === "add" ? "Add Product" : "Update Product"}
        </button>
      </div>
    </form>
  );
}
