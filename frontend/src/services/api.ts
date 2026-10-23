import { Product, AdminUser, CustomerUser } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

// Default backend API base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// 1. Fetch Products
export async function fetchProductsAPI(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Fallback if backend server is unreachable
  }
  return INITIAL_PRODUCTS;
}

// 2. Admin Login API
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
  } catch (err) {
    // Fallback simulation if backend offline
    if (email === 'admin@quickpick.com' && password === 'admin123') {
      return {
        success: true,
        user: {
          email,
          name: 'Alex Johnson',
          role: 'Station Administrator',
          avatar: 'A',
        },
      };
    }
    return { success: false, error: 'Connection failed to backend server.' };
  }
}

// 3. Customer Login API
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
    return { success: false, error: data.error || 'Invalid customer credentials' };
  } catch (err) {
    // Fallback demo simulation
    return {
      success: true,
      user: {
        id: 'usr_demo_882',
        name: 'Alex Johnson',
        email,
        phone: '+91 98765 43210',
        avatar: 'A',
        membershipTier: 'Gold Member',
        balancePaise: 50000,
      },
    };
  }
}

// 4. Customer Register API
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
  } catch (err) {
    return {
      success: true,
      user: {
        id: `usr_${Date.now()}`,
        name,
        email,
        phone: phone || '',
        avatar: name.charAt(0).toUpperCase(),
        membershipTier: membershipTier || 'Bronze Member',
        balancePaise: 10000,
      },
    };
  }
}

// 5. Create Order API
export async function createOrderAPI(items: { productId: string; quantity: number }[]): Promise<{
  orderId: string;
  orderNumber: string;
  totalPaise: number;
  expiresInSeconds: number;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback to local simulation if backend fails
  }

  // Simulated fallback
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return {
    orderId: `ord_${Date.now()}`,
    orderNumber: `ORD${randomNum}`,
    totalPaise: items.reduce((sum, item) => {
      const prod = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
      return sum + (prod ? prod.pricePaise * item.quantity : 0);
    }, 0),
    expiresInSeconds: 120,
  };
}

// 6. Claim Pickup API
export async function claimPickupAPI(orderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pickup-claim`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}
