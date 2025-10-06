
// lib/api.ts


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/v1/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }

  return res.json();
}



export async function fetchUserProfile() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("No access token found");
  }

  const res = await fetch(`${API_URL}/user/me/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ Attach token properly
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return res.json();
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) throw new Error("No refresh token");

  const response = await fetch("http://johncast.pythonanywhere.com/api/v1/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) throw new Error("Refresh failed");
  const data = await response.json();

  localStorage.setItem("accessToken", data.access);
  return data.access;
}

// lib/api.ts
export interface Product {
  id: number;
  name: string;
  generic?: string;
  category?: string;
  stock?: number;
  packet?: string;
  quantityPerPacket?: number;
  unitPrice?: string;
  price?: string;
}

// ---- Helper to get auth headers ----
export function authHeaders() {
  const token = localStorage.getItem("access"); // ✅ match your login
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const API_BASE = "http://johncast.pythonanywhere.com/api";




// ---- GET list with pagination & search ----
export async function getProducts({
  page,
  pageSize,
  search,
  signal,
}: {
  page: number;
  pageSize: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<{ results: Product[]; count: number }> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (search) params.set("search", search);

  const res = await fetch(`${API_URL}/v1/goods/?${params.toString()}`, {
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch products (${res.status})`);
  }
  return res.json();
}

// ---- CREATE ----
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_URL}/v1/goods/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create product (${res.status})`);
  }
  return res.json();
}

// ---- UPDATE ----
export async function updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_URL}/v1/goods/${id}/`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to update product (${res.status})`);
  }
  return res.json();
}


// ---- DELETE ----
export async function deleteProduct(id: number) {
  const res = await fetch(`${API_URL}/v1/goods/${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete product (${res.status})`);
  }

  // Django usually returns 204 No Content
  return true;
}



// ---- NOTIFICATIONS ----
export interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  product_price: number
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_URL}/notifications/`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch notifications");

  const data = await res.json();

  // Match actual backend response
  return Array.isArray(data)
    ? data
    : data.notifications ?? [];
}



export async function markNotificationRead(id: number, is_read: boolean) {
  const res = await fetch(`${API_URL}/notifications/${id}/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_read }),
  });
  if (!res.ok) throw new Error("Failed to update notification");
  return res.json();
}

export async function deleteNotification(productId: number) {
  const res = await fetch(`${API_URL}/notifications/${productId}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete notification");
  return true;
}


