import React from 'react';
import {
  Package,
  CheckCircle,
  XCircle,
  Receipt,
  CheckCheck,
  Clock,
  AlertTriangle,
  IndianRupee,
  ArrowRight,
  BarChart3,
  Sparkles,
  AlertOctagon,
  Eye,
  Box,
} from 'lucide-react';
import { Order, Product, AdminLocker } from '../../types';
import { formatRupees } from '../../utils/format';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  lockers: AdminLocker[];
  onViewOrder: (order: Order) => void;
  onNavigateTab: (tab: AdminTab) => void;
  onSimulateNewOrder?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  lockers,
  onViewOrder,
  onNavigateTab,
  onSimulateNewOrder,
}) => {
  // 8 Exact KPI Values
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive !== false).length;
  const inactiveProducts = products.filter((p) => p.isActive === false).length;

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'claimed').length;
  const pendingOrders = orders.filter((o) => o.status === 'unpaid').length;
  const expiredOrders = orders.filter((o) => o.status === 'expired').length;

  const totalRevenuePaise = orders
    .filter((o) => o.status === 'paid' || o.status === 'claimed')
    .reduce((sum, o) => sum + o.totalPaise, 0);

  // Low stock products (stock <= 5)
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Sample analytics data for charts (Weekly order volume and revenue)
  const sampleWeeklyData = [
    { day: 'Mon', revenue: 1450, orders: 18, heightPct: 45 },
    { day: 'Tue', revenue: 2100, orders: 26, heightPct: 65 },
    { day: 'Wed', revenue: 1800, orders: 22, heightPct: 55 },
    { day: 'Thu', revenue: 2750, orders: 34, heightPct: 85 },
    { day: 'Fri', revenue: 3200, orders: 40, heightPct: 100 },
    { day: 'Sat', revenue: 2900, orders: 36, heightPct: 90 },
    { day: 'Sun', revenue: 2400, orders: 30, heightPct: 75 },
  ];

  // Dynamic Category Share distribution derived from live products
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const totalCatCount = products.length || 1;
  const categoryIcons: Record<string, string> = {
    Snacks: '🍿',
    Drinks: '🥤',
    Chocolates: '🍫',
    Biscuits: '🍪',
    Combos: '🍱',
    Others: '📦',
  };
  const categoryColors: Record<string, string> = {
    Snacks: '#636B2F',
    Drinks: '#889343',
    Chocolates: '#BAC095',
    Biscuits: '#D4DE95',
    Combos: '#A3B18A',
    Others: '#588157',
  };
  const categoryShare = Object.entries(categoryCounts).map(([catName, count]) => {
    const pct = Math.round((count / totalCatCount) * 100);
    return {
      name: catName,
      share: `${pct}%`,
      count,
      icon: categoryIcons[catName] || '📦',
      color: categoryColors[catName] || '#636B2F',
    };
  });

  const inUseLockers = lockers.filter((l) => l.status === 'occupied' || l.status === 'reserved').length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 select-none">
      {/* Dashboard Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#636B2F] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-[#3D4127] tracking-tight">
              QuickPick Counter Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#3D4127]/70 font-medium mt-1">
            Real-time kiosk metrics, dispensing telemetry, and inventory stock overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSimulateNewOrder && (
            <button
              type="button"
              onClick={onSimulateNewOrder}
              className="px-3.5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4DE95]" />
              <span>Simulate Order</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigateTab('lockers')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9F3] border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Box className="w-3.5 h-3.5 text-[#636B2F]" />
            <span>Lockers ({inUseLockers} Active)</span>
          </button>
        </div>
      </div>

      {/* 8 Modern KPI Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
            Core Performance Indicators (8 Metrics)
          </h2>
          <span className="text-[11px] font-bold text-[#636B2F] bg-[#F0F2E5] px-2.5 py-0.5 rounded-full border border-[#BAC095]/40">
            Live Kiosk Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Products */}
          <div
            onClick={() => onNavigateTab('products')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              📦
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Total Products
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center text-[#636B2F] group-hover:bg-[#636B2F] group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {totalProducts}
              </span>
              <span className="text-[11px] font-bold text-[#636B2F] bg-[#F0F2E5] px-2 py-0.5 rounded-lg border border-[#BAC095]/40">
                Catalog
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Registered items in kiosk database
            </p>
          </div>

          {/* Card 2: Active Products */}
          <div
            onClick={() => onNavigateTab('products')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              🍿
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Active Products
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {activeProducts}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Dispensing
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Visible on customer ordering kiosk
            </p>
          </div>

          {/* Card 3: Inactive Products */}
          <div
            onClick={() => onNavigateTab('products')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              ⏸️
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Inactive Products
              </span>
              <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 group-hover:bg-stone-700 group-hover:text-white transition-colors">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {inactiveProducts}
              </span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                Paused
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Hidden from kiosk (seasonal / unlisted)
            </p>
          </div>

          {/* Card 4: Total Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              🧾
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Total Orders
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center text-[#636B2F] group-hover:bg-[#636B2F] group-hover:text-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {totalOrders}
              </span>
              <span className="text-[11px] font-bold text-[#636B2F] bg-[#F0F2E5] px-2 py-0.5 rounded-lg border border-[#BAC095]/40">
                All-time
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Total checkout requests generated
            </p>
          </div>

          {/* Card 5: Paid Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              ✅
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Paid Orders
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {paidOrders}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Captured
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Confirmed UPI payments & dispensed
            </p>
          </div>

          {/* Card 6: Pending Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              ⏳
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Pending Orders
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {pendingOrders}
              </span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                120s Hold
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Awaiting UPI webhook confirmation
            </p>
          </div>

          {/* Card 7: Expired Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative bg-white rounded-3xl p-5 border border-[#E3E6D3] shadow-xs hover:shadow-md hover:border-[#636B2F]/40 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-10 select-none group-hover:scale-110 transition-transform">
              ⚠️
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#3D4127]/70">
                Expired Orders
              </span>
              <div className="w-9 h-9 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#3D4127] tracking-tight">
                {expiredOrders}
              </span>
              <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                Restored
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Timed out & inventory released safely
            </p>
          </div>

          {/* Card 8: Revenue */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="group relative bg-white rounded-3xl p-5 border border-[#BAC095] shadow-xs hover:shadow-md hover:border-[#636B2F] transition-all duration-300 cursor-pointer overflow-hidden bg-gradient-to-br from-white via-white to-[#F0F2E5]/50"
          >
            <span className="absolute -right-2 -bottom-2 text-4xl opacity-15 select-none group-hover:scale-110 transition-transform">
              💰
            </span>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#636B2F]">
                Total Revenue
              </span>
              <div className="w-9 h-9 rounded-2xl bg-[#636B2F] flex items-center justify-center text-white shadow-xs">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-[#3D4127] tracking-tight">
                {formatRupees(totalRevenuePaise)}
              </span>
              <span className="text-[11px] font-black text-[#636B2F] bg-[#D4DE95]/60 px-2 py-0.5 rounded-lg">
                +14.2%
              </span>
            </div>
            <p className="text-[11px] text-[#3D4127]/60 mt-1 font-medium">
              Total gross revenue from paid orders
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Products Section */}
      <div className="bg-white rounded-3xl border border-[#E3E6D3] shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#3D4127]">
                Low Stock Alert Products ({lowStockProducts.length})
              </h3>
              <p className="text-xs text-[#3D4127]/60">
                Snacks requiring immediate replenishment inside dispenser compartments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="text-xs font-bold text-[#636B2F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] text-xs font-bold text-emerald-800">
            ✓ All snack items have healthy stock levels (&gt; 5 units).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigateTab('products')}
                className="p-3.5 rounded-2xl bg-[#FCFDF9] border border-[#BAC095]/40 hover:border-[#636B2F] hover:shadow-xs transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F0F2E5] border border-[#BAC095]/30 overflow-hidden flex items-center justify-center p-1 shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[#3D4127] text-xs truncate">{p.name}</div>
                  <div className="text-[10px] text-[#3D4127]/60">{p.category}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200">
                      {p.stock} left
                    </span>
                    <span className="text-[10px] font-bold text-[#636B2F]">
                      {p.stock === 0 ? 'Out of Stock' : 'Critical Stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Productivity and Analytics Section (Sample Visuals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue & Orders Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E3E6D3] shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#636B2F]" />
                  <h3 className="text-base font-black text-[#3D4127]">
                    Productivity & Revenue Trend
                  </h3>
                </div>
                <p className="text-xs text-[#3D4127]/60">
                  Weekly transaction volume across kiosk station #01
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#F0F2E5] text-[#3D4127] border border-[#BAC095]/40 self-start sm:self-auto">
                Sample Design Data
              </span>
            </div>

            {/* SVG / CSS Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-[#E3E6D3]">
                {sampleWeeklyData.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold bg-[#3D4127] text-white px-2 py-1 rounded-lg shadow-md pointer-events-none whitespace-nowrap -translate-y-1">
                      ₹{item.revenue} ({item.orders} orders)
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${item.heightPct}%` }}
                      className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#636B2F] to-[#BAC095] group-hover:to-[#D4DE95] transition-all duration-300 shadow-xs"
                    />
                  </div>
                ))}
              </div>

              {/* Day Labels */}
              <div className="flex items-center justify-between px-2 pt-2 text-[11px] font-bold text-[#3D4127]/70">
                {sampleWeeklyData.map((item) => (
                  <div key={item.day} className="flex-1 text-center">
                    {item.day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3E6D3] flex items-center justify-between text-xs text-[#3D4127]/70">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#636B2F]" />
              Peak Kiosk Hours: 4:00 PM – 7:30 PM
            </span>
            <span className="font-bold text-[#636B2F]">Average: 29 orders/day</span>
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="bg-white rounded-3xl border border-[#E3E6D3] shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#3D4127]">Category Share</h3>
                <p className="text-xs text-[#3D4127]/60">Product distribution from database</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F0F2E5] text-[#3D4127] border border-[#BAC095]/40">
                Live Catalog Share
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {categoryShare.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#3D4127]/60">
                  No active categories loaded.
                </div>
              ) : (
                categoryShare.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#3D4127]">
                      <span className="flex items-center gap-1.5">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span>{cat.share}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F0F2E5] overflow-hidden">
                      <div
                        style={{ width: cat.share, backgroundColor: cat.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#E3E6D3] text-[11px] text-[#3D4127]/60">
            Real-time category mix dynamically computed from PostgreSQL catalog.
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-3xl border border-[#E3E6D3] shadow-xs p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-[#3D4127]">Recent Kiosk Transactions</h3>
            <p className="text-xs text-[#3D4127]/60">
              Latest payment gateway webhook captures & dispenser holds
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#636B2F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3E6D3] text-[10px] font-black uppercase text-[#3D4127]/60">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Compartment</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6D3]/60">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#3D4127]/60 font-medium">
                    No recent kiosk orders found in PostgreSQL database. Click "Simulate Order" above to generate a new transaction.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAFBF5] transition-colors">
                  <td className="py-3 px-3 font-black text-[#3D4127]">{ord.orderNumber}</td>
                  <td className="py-3 px-3 font-bold text-[#3D4127]">
                    {formatRupees(ord.totalPaise)}
                  </td>
                  <td className="py-3 px-3">
                    {ord.status === 'paid' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Paid
                      </span>
                    ) : ord.status === 'unpaid' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    ) : ord.status === 'expired' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                        {ord.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#3D4127]/70">
                    {ord.lockerNumber || 'Unassigned'}
                  </td>
                  <td className="py-3 px-3 text-[#3D4127]/60">{ord.createdAt}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewOrder(ord)}
                      className="px-2.5 py-1 rounded-lg border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#636B2F] font-bold text-xs cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
