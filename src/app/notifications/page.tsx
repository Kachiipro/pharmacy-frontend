"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  Notification,
} from "@/lib/api";
import { Trash2, CheckCircle, Circle } from "lucide-react";

export default function NotificationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleRead = async (n: Notification) => {
    try {
      const updated = await markNotificationRead(n.id, !n.is_read);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? updated : item))
      );
    } catch (err) {
      console.error("Failed to update notification", err);
    }
  };

  const handleDelete = async (productId: number) => {
  if (!confirm("Delete this notification?")) return;
  const prev = notifications;
  setNotifications((prev) => prev.filter((n) => n.id !== productId));
  try {
    await deleteNotification(productId);
  } catch (err) {
    console.error("Delete failed", err);
    setNotifications(prev); // rollback
  }
};


  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 bg-white shadow rounded-lg flex justify-between items-center ${
                n.is_read ? "opacity-70" : "border-l-4 border-blue-500"
              }`}
            >
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-gray-600">{n.message}</p>
                <span className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </span>
                 {/* Price added here */}
      <span className="text-primary font-bold">New price:
        ₦{n.product_price}
      </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => toggleRead(n)}
                  className="p-2 rounded hover:bg-gray-200"
                  title={n.is_read ? "Mark as unread" : "Mark as read"}
                >
                  {n.is_read ? (
                    <CheckCircle className="text-green-600" size={18} />
                  ) : (
                    <Circle className="text-gray-500" size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded hover:bg-red-100 text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {notifications.length === 0 && !loading && (
          <p className="text-gray-500 mt-4">No notifications 📭</p>
        )}
      </div>
    </main>
  );
}
