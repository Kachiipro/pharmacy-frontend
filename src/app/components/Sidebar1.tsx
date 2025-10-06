"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Box,
  Layers,
  Bell,
  Users,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Redirect to login
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Products", href: "/products", icon: Box },
    { name: "Categories", href: "/categories", icon: Layers },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Staff", href: "/staff", icon: Users },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-gray-800 text-white min-h-screen flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <span className={`${collapsed ? "hidden" : "block"} text-lg font-bold`}>
          Admin
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-2 space-y-1">
        {navLinks.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Icon size={20} />
            {!collapsed && <span>{name}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
