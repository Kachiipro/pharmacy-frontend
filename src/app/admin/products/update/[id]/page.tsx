"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "../../../../components/ProductForm";

export default function UpdateProductPage() {
  const params = useParams();
  const router = useRouter();

  // ⚡ Ensure id is string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const isSuperuser = localStorage.getItem("is_superuser");

    if (!token) {
      router.push("/login");
      return;
    }
    if (isSuperuser !== "true") {
      router.push("/dashboard");
      return;
    }

    async function fetchProduct() {
      try {
        const res = await fetch(`https://johncast.pythonanywhere.com/api/v1/goods/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched product:", data);
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id, router]);

  const handleUpdate = async (data: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://johncast.pythonanywhere.com/api/v1/goods/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
      }

      alert(`Product ${id} updated successfully!`);
      router.push("/admin/products");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("❌ Update failed. Check console for details.");
    }
  };

  if (loading) {
    return <p className="p-6">Loading product...</p>;
  }

  if (!product) {
    return <p className="p-6 text-red-600">Product not found</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <ProductForm
        initialData={product}
        mode="edit"
        onSubmit={handleUpdate}
      />
    </div>
  );
}
