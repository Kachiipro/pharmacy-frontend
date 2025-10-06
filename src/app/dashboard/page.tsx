"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Box, Layers, Users, Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Stats {
  products: number;
  categories: number;
  staff: number;
  notifications: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [stats, setStats] = useState<Stats>({
    products: 0,
    categories: 0,
    staff: 0,
    notifications: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login"); // redirect if no token
      return;
    }

    setIsChecked(true);
    fetchDashboardData(token);
  }, [router]);

  async function fetchDashboardData(token: string) {
    try {
      const res = await fetch(`${API_URL}/dashboard-stats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        console.warn("Unauthorized → redirecting to login");
        localStorage.removeItem("accessToken"); // clear invalid token
        router.replace("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch dashboard stats");

      const data = await res.json();
      setStats({
        products: data.products || 0,
        categories: data.categories || 0,
        staff: data.staff || 0,
        notifications: data.notifications || 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  }

  if (!isChecked) {
    return null; // wait until login check completes
  }

  return (
    <main className="flex min-h-screen bg-gray-100">

      <div className="flex-1 p-4 md:p-6">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Products"
              value={stats.products}
              color="bg-blue-500"
              icon={<Box size={28} />}
            />
            <StatCard
              title="Categories"
              value={stats.categories}
              color="bg-green-500"
              icon={<Layers size={28} />}
            />
            <StatCard
              title="Staff"
              value={stats.staff}
              color="bg-purple-500"
              icon={<Users size={28} />}
            />
            <StatCard
              title="Notifications"
              value={stats.notifications}
              color="bg-red-500"
              icon={<Bell size={28} />}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`p-6 rounded-xl shadow-md text-white flex flex-col items-center justify-center ${color}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <h4 className="text-lg font-semibold">{title}</h4>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
