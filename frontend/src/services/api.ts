import { Product, AdminUser, CustomerUser, CategoryItem } from '../types';

// Default backend API base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper to get customer JWT token
 */
export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem('snackhub_customer_token');
  } catch {
    return null;
  }
}

/**
 * Helper for customer authenticated headers
 */
function getCustomerAuthHeaders(): HeadersInit {
  const token = getCustomerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================================
// 1. Categories API (Active Only)
// ==========================================
export async function fetchCategoriesAPI(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok) {
      throw new Error(`Failed to load categories: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('Error in fetchCategoriesAPI:', err.message);
    return [];
  }
}

// ==========================================
// 2. Products API (Active Only from DB)
// ==========================================
export async function fetchProductsAPI(params?: {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
}): Promise<Product[]> {
  try {
    const url = new URL(`${API_BASE_URL}/products`);
    if (params?.category && params.category !== 'All') {
      url.searchParams.set('category', params.category);
    }
    if (params?.search) {
      url.searchParams.set('search', params.search);
    }
    if (params?.sort) {
      url.searchParams.set('sort', params.sort);
    }
    if (params?.limit) {
      url.searchParams.set('limit', String(params.limit));
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Failed to load products: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('Error in fetchProductsAPI:', err.message);
    return [];
  }
}

// ==========================================
// 3. Search Products API (With Debouncing)
// ==========================================
export async function searchProductsAPI(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      throw new Error(`Search error: ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('Error in searchProductsAPI:', err.message);
    return [];
  }
}

// ==========================================
// 4. Product Details by ID
// ==========================================
export async function fetchProductByIdAPI(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ==========================================
// 5. Customer Authentication & Profile
// ==========================================
export async function customerLoginAPI(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: CustomerUser; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        localStorage.setItem('snackhub_customer_token', data.token);
      }
      return { success: true, token: data.token, user: data.user };
    }
    return { success: false, error: data.error || 'Invalid email or password' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed to server' };
  }
}

export async function customerRegisterAPI(
  name: string,
  email: string,
  password: string,
  phone?: string,
  membershipTier?: string
): Promise<{ success: boolean; token?: string; user?: CustomerUser; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, membershipTier }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        localStorage.setItem('snackhub_customer_token', data.token);
      }
      return { success: true, token: data.token, user: data.user };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed to server' };
  }
}

export async function fetchCustomerProfileAPI(): Promise<CustomerUser | null> {
  const token = getCustomerToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/profile`, {
      headers: getCustomerAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateCustomerProfileAPI(data: {
  name?: string;
  phone?: string;
  avatar?: string;
}): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/customer/profile`, {
      method: 'PUT',
      headers: getCustomerAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok && result.success) {
      return { success: true, user: result.user };
    }
    return { success: false, error: result.error || 'Failed to update profile' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function customerLogoutAPI() {
  try {
    localStorage.removeItem('snackhub_customer_token');
    localStorage.removeItem('snackhub_customer');
  } catch {}
}

// ==========================================
// 6. Wishlist APIs
// ==========================================
export async function fetchWishlistAPI(): Promise<Product[]> {
  const token = getCustomerToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/customer/wishlist`, {
      headers: getCustomerAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function addToWishlistAPI(productId: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/wishlist/${productId}`, {
      method: 'POST',
      headers: getCustomerAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeFromWishlistAPI(productId: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getCustomerAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// 7. Cart APIs
// ==========================================
export async function fetchCartAPI(): Promise<{
  items: { productId: string; quantity: number; product: Product }[];
  totalCount: number;
  totalPaise: number;
}> {
  const token = getCustomerToken();
  if (!token) return { items: [], totalCount: 0, totalPaise: 0 };

  try {
    const res = await fetch(`${API_BASE_URL}/customer/cart`, {
      headers: getCustomerAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
    return { items: [], totalCount: 0, totalPaise: 0 };
  } catch {
    return { items: [], totalCount: 0, totalPaise: 0 };
  }
}

export async function addToCartAPI(productId: string, quantity = 1): Promise<{ success: boolean; error?: string }> {
  const token = getCustomerToken();
  if (!token) return { success: true }; // Allowed locally if guest

  try {
    const res = await fetch(`${API_BASE_URL}/customer/cart`, {
      method: 'POST',
      headers: getCustomerAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCartItemAPI(productId: string, quantity: number): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/cart/${productId}`, {
      method: 'PUT',
      headers: getCustomerAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeCartItemAPI(productId: string): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/cart/${productId}`, {
      method: 'DELETE',
      headers: getCustomerAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearCartAPI(): Promise<boolean> {
  const token = getCustomerToken();
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE_URL}/customer/cart`, {
      method: 'DELETE',
      headers: getCustomerAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// 8. Order Placement & Pickup
// ==========================================
export async function createOrderAPI(payload: {
  items: { productId: string; quantity: number }[];
  customerId?: string;
  paymentMethod?: 'upi' | 'wallet';
}): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalPaise?: number;
  lockerNumber?: string;
  status?: string;
  expiresInSeconds?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data;
    }
    return { success: false, error: data.error || 'Failed to create order' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to place order' };
  }
}

export async function confirmOrderPaymentAPI(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function claimPickupAPI(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pickup-claim`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// 9. Admin Login
// ==========================================
export async function adminLoginAPI(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: AdminUser; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
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
    return { success: false, error: data.error || 'Invalid credentials' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed to server' };
  }
}

// ==========================================
// 10. Feedback & Rating API
// ==========================================
export async function submitFeedbackAPI(payload: {
  orderId?: string;
  rating: number;
  tags?: string[];
  comment?: string;
  productId?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to submit feedback' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

