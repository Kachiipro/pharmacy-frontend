"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "../../../components/ProductForm";

export default function AddProductPage() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Check if user is logged in
    const token = localStorage.getItem("accessToken");
    const isSuperuser = localStorage.getItem("is_superuser");

    if (!token) {
      // Not logged in → redirect to login
      router.push("/login");
    } else if (isSuperuser !== "true") {
      // Logged in but not admin → redirect to dashboard
      router.push("/dashboard");
    }
  }, [router]);

  // ✅ Handle form submit
  const handleAdd = async (data: any) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token found");

      const res = await fetch("http://127.0.0.1:8000/api/v1/goods/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to add product:", errorData);
        throw new Error(`Failed: ${res.status}`);
      }

      const product = await res.json();
      console.log("✅ Product added:", product);

      alert("Product added successfully!");
      router.push("/admin/products"); // redirect back to product list
    } catch (err) {
      console.error("❌ Error adding product:", err);
      alert("Failed to add product. Please try again.");
    }
  };

  return (
    <div className="p-4 md:p-6">
      <ProductForm mode="add" onSubmit={handleAdd} />
    </div>
  );
}
