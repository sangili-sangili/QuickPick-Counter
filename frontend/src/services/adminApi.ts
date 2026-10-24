import { CategoryItem, Product, Order, SmartLocker, CustomerUser, AdminUser } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('quickpick_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ApiActionResponse {
  success: boolean;
  message: string;
}

// ==========================================
// 1. Admin Authentication API
// ==========================================
export async function adminLoginApi(
  email: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  user?: AdminUser;
  field?: 'email' | 'password';
  message?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        sessionStorage.setItem('quickpick_admin_token', data.token);
      }
      return { success: true, token: data.token, user: data.user };
    }

    return {
      success: false,
      field: data.field,
      message: data.message || 'Login failed. Please verify credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to connect to backend server. Make sure server is running on port 3000.',
    };
  }
}

export async function getAdminProfileApi(): Promise<AdminUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {}
  return null;
}

// ==========================================
// 2. Admin Dashboard Stats API
// ==========================================
export interface DashboardStatsResponse {
  stats: {
    products: { total: number; active: number; inactive: number; lowStockCount: number };
    orders: {
      total: number;
      paid: number;
      pending: number;
      expired: number;
      needsReview: number;
      claimed: number;
      revenuePaise: number;
      revenueRupees: number;
    };
    lockers: { total: number; available: number; inUse: number; maintenance: number };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalPaise: number;
    totalRupees: number;
    status: string;
    lockerNumber: string | null;
    customerName: string;
    createdAt: string;
    itemCount: number;
    itemsSummary: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    pricePaise: number;
    image: string;
  }>;
  lockers: Array<{
    id: string;
    number: string;
    name: string;
    status: string;
    temperatureC: number;
    doorState: string;
  }>;
  weeklyAnalytics: Array<{ day: string; revenue: number; orders: number; heightPct: number }>;
}

export async function getAdminDashboardApi(): Promise<DashboardStatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {}
  return null;
}

// ==========================================
// 3. Admin Categories API
// ==========================================
export async function getAdminCategoriesApi(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.categories || [];
    }
  } catch (err) {}
  return [];
}

export async function createAdminCategoryApi(category: Partial<CategoryItem>): Promise<CategoryItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(category),
    });
    if (res.ok) {
      const data = await res.json();
      return data.category;
    }
  } catch (err) {}
  return null;
}

export async function updateAdminCategoryApi(id: string, category: Partial<CategoryItem>): Promise<CategoryItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(category),
    });
    if (res.ok) {
      const data = await res.json();
      return data.category;
    }
  } catch (err) {}
  return null;
}

export async function deleteAdminCategoryApi(id: string): Promise<ApiActionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Category deleted successfully' };
    }
    return {
      success: false,
      message: data.message || `Failed to delete category (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error deleting category' };
  }
}

// ==========================================
// 4. Admin Products API
// ==========================================
export async function getAdminProductsApi(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.products || [];
    }
  } catch (err) {}
  return [];
}

export async function createAdminProductApi(product: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (res.ok) {
      const data = await res.json();
      return data.product;
    }
  } catch (err) {}
  return null;
}

export async function updateAdminProductApi(id: string, product: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (res.ok) {
      const data = await res.json();
      return data.product;
    }
  } catch (err) {}
  return null;
}

export async function updateAdminProductStockApi(id: string, stock: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stock }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteAdminProductApi(id: string): Promise<ApiActionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Product deleted from catalog' };
    }
    return {
      success: false,
      message: data.message || `Failed to delete product (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error deleting product' };
  }
}

// ==========================================
// 5. Admin Orders API
// ==========================================
export async function getAdminOrdersApi(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.orders || [];
    }
  } catch (err) {}
  return [];
}

export async function updateAdminOrderStatusApi(id: string, status: Order['status']): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function simulateAdminOrderApi(): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.order;
    }
  } catch (err) {}
  return null;
}

export async function deleteAdminOrderApi(id: string): Promise<ApiActionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Order deleted successfully' };
    }
    return {
      success: false,
      message: data.message || `Failed to delete order (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error deleting order' };
  }
}

export async function simulateAdminWebhookApi(
  orderNumber: string,
  outcome: 'captured' | 'failed' | 'mismatch'
): Promise<ApiActionResponse & { eventId?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/orders/simulate-webhook`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderNumber, outcome }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `Webhook processed: ${outcome}`,
        eventId: data.eventId,
      };
    }
    return {
      success: false,
      message: data.message || data.error || `Webhook rejected (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error simulating webhook' };
  }
}

// ==========================================
// 6. Admin Lockers API
// ==========================================
export async function getAdminLockersApi(): Promise<SmartLocker[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/lockers`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.lockers || [];
    }
  } catch (err) {}
  return [];
}

export async function toggleUnlockLockerApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/lockers/${id}/unlock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function setLockerMaintenanceApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/lockers/${id}/maintenance`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function resetLockerApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/lockers/${id}/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function emergencyUnlockAllApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/lockers/emergency-unlock-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// ==========================================
// 7. Admin Notifications API
// ==========================================
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  time: string;
}

export async function getAdminNotificationsApi(): Promise<{
  notifications: AdminNotification[];
  unreadCount: number;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/notifications`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      };
    }
  } catch (err) {}
  return { notifications: [], unreadCount: 0 };
}

export async function markAllNotificationsReadApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function markNotificationReadApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// ==========================================
// 8. Admin Customers API
// ==========================================
export async function getAdminCustomersApi(tier?: string, search?: string): Promise<CustomerUser[]> {
  try {
    const params = new URLSearchParams();
    if (tier && tier !== 'all') params.append('tier', tier);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/admin/customers?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.customers || [];
    }
  } catch (err) {}
  return [];
}

export async function createAdminCustomerApi(customer: Partial<CustomerUser>): Promise<CustomerUser | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    if (res.ok) {
      const data = await res.json();
      return data.customer;
    }
  } catch (err) {}
  return null;
}

export async function updateAdminCustomerApi(id: string, customer: Partial<CustomerUser>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function deleteAdminCustomerApi(id: string): Promise<ApiActionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Customer deleted successfully' };
    }
    return {
      success: false,
      message: data.message || `Failed to delete customer (HTTP ${res.status})`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error deleting customer' };
  }
}
