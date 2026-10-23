import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

// Only attempt network requests if VITE_API_URL is explicitly configured
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

export async function fetchProductsAPI(): Promise<Product[]> {
  if (!API_BASE_URL) {
    // Standalone / frontend-only demo mode: immediately use INITIAL_PRODUCTS without network refusal
    return INITIAL_PRODUCTS;
  }

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

export async function createOrderAPI(items: { productId: string; quantity: number }[]): Promise<{
  orderId: string;
  orderNumber: string;
  totalPaise: number;
  expiresInSeconds: number;
}> {
  if (API_BASE_URL) {
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

export async function claimPickupAPI(orderId: string): Promise<boolean> {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pickup-claim`, {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      return true;
    }
  }
  return true; // simulated fallback
}
