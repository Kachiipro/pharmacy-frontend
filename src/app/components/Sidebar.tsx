"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Box,
  Layers,
  Bell,
  Users,
  LogOut,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { isSuperUser } from "@/lib/auth";
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [superUser, setSuperUser] = useState(false);

  useEffect(() => {
    setSuperUser(isSuperUser());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/products", icon: Home },
    { name: "Products", href: "/products", icon: Box },
    { name: "Categories", href: "/categories", icon: Layers },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Staff", href: "/staff", icon: Users },
  ];

  return (
    <aside
      className={`relative ${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center md:justify-between p-4 border-b border-gray-800">
        {!collapsed && <span className="text-xl font-bold">Admin</span>}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center shadow-md transition"
      >
        <ChevronLeft
          size={18}
          className={`text-white transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Icon size={20} />
            {!collapsed && <span>{name}</span>}
          </Link>
        ))}

        {/* ✅ Only show Admin Products for superusers */}
        {superUser && (
          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Shield size={20} />
            {!collapsed && <span>Admin Products</span>}
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
