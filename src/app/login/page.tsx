"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  user_id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  exp: number;
  iat: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://johncast.pythonanywhere.com/api/v1/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // assuming your serializer accepts email+password
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();

      // Store tokens
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("accessToken", data.access);

 

      // ✅ Decode the token to get user info
      const decoded = jwtDecode<DecodedToken>(data.access);

      localStorage.setItem("user_id", String(decoded.user_id));
      localStorage.setItem("username", decoded.username || "");
      localStorage.setItem("email", decoded.email || "");
      localStorage.setItem("is_superuser", decoded.is_superuser ? "true" : "false");

      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-600 to-blue-400 text-white items-center justify-center p-10">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="mb-6 text-lg">
            To keep connected with us please login with your personal info.
          </p>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex flex-1 items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
