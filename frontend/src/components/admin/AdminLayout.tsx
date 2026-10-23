import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  Receipt,
  Box,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ExternalLink,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Order, Product, ToastMessage, CategoryItem, AdminUser } from '../../types';
import { AdminLocker, INITIAL_LOCKERS, INITIAL_ADMIN_ORDERS, INITIAL_CATEGORIES } from '../../data/mockAdminData';
import { INITIAL_PRODUCTS } from '../../data/mockProducts';
import { AdminDashboard } from './AdminDashboard';
import { AdminCategories } from './AdminCategories';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminLockers } from './AdminLockers';
import { AdminSettings } from './AdminSettings';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { AdminProductModal } from './AdminProductModal';
import { AdminLogin } from './AdminLogin';
import { ToastContainer } from '../common/Toast';

export type AdminTab = 'dashboard' | 'categories' | 'products' | 'orders' | 'lockers' | 'settings';

const VALID_ADMIN_TABS: AdminTab[] = ['dashboard', 'categories', 'products', 'orders', 'lockers', 'settings'];

const getTabFromLocation = (pathname: string): AdminTab => {
  const parts = pathname.split('/').filter(Boolean);
  // e.g. /admin/products -> parts is ['admin', 'products']
  if (parts.length >= 2 && parts[0] === 'admin') {
    const subRoute = parts[1].toLowerCase() as AdminTab;
    if (VALID_ADMIN_TABS.includes(subRoute)) {
      return subRoute;
    }
  }
  // Check sessionStorage fallback if landed on /admin
  const savedTab = sessionStorage.getItem('quickpick_admin_active_tab') as AdminTab | null;
  if (savedTab && VALID_ADMIN_TABS.includes(savedTab)) {
    return savedTab;
  }
  return 'dashboard';
};

interface AdminLayoutProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onGoToCustomerKiosk: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  products,
  onUpdateProducts,
  onGoToCustomerKiosk,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('quickpick_admin_auth') === 'true';
  });

  const [adminUser, setAdminUser] = useState<AdminUser>({
    email: 'admin@quickpick.com',
    name: 'Alex Johnson',
    role: 'Station Administrator',
    avatar: 'A',
  });

  // Derive activeTab directly from current URL path, remembering on reload
  const [activeTab, setActiveTab] = useState<AdminTab>(() => getTabFromLocation(location.pathname));

  // Keep activeTab in sync with browser location and normalize /admin -> /admin/${tab}
  useEffect(() => {
    const resolvedTab = getTabFromLocation(location.pathname);
    setActiveTab(resolvedTab);
    sessionStorage.setItem('quickpick_admin_active_tab', resolvedTab);

    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate(`/admin/${resolvedTab}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    sessionStorage.setItem('quickpick_admin_active_tab', tab);
    navigate(`/admin/${tab}`);
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notifications dropdown state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Low Stock Alert',
      message: 'Red Bull Can (250ml) inventory reached 3 units.',
      time: '5m ago',
      type: 'warning' as const,
      read: false,
    },
    {
      id: 'notif_2',
      title: 'Payment Captured',
      message: 'Order #ORD1234 completed payment of ₹110 via UPI.',
      time: '12m ago',
      type: 'success' as const,
      read: false,
    },
    {
      id: 'notif_3',
      title: 'Locker Telemetry Check',
      message: 'Solenoid diagnostics verified for 12 dispenser compartments.',
      time: '45m ago',
      type: 'info' as const,
      read: false,
    },
  ]);

  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Admin Data State
  const [orders, setOrders] = useState<Order[]>(INITIAL_ADMIN_ORDERS);
  const [lockers, setLockers] = useState<AdminLocker[]>(INITIAL_LOCKERS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  // Modals state
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth actions
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setIsAuthenticated(true);
    sessionStorage.setItem('quickpick_admin_auth', 'true');
    addToast('success', `Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('quickpick_admin_auth');
    setIsProfileDropdownOpen(false);
    addToast('info', 'Logged out of Admin Portal.');
  };

  // Order actions
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            timeline: [
              ...(ord.timeline || []),
              {
                title: `Status changed to ${status.toUpperCase()} by Admin`,
                time: new Date().toLocaleTimeString(),
                completed: true,
              },
            ],
          };
        }
        return ord;
      })
    );
    addToast('success', `Order status updated to ${status.toUpperCase()}`);
  };

  // Locker actions
  const handleToggleUnlockLocker = (lockerId: string) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id === lockerId) {
          const nextState = l.doorState === 'locked' ? 'unlocked' : 'locked';
          addToast('info', `${l.name} compartment solenoid ${nextState}`);
          return { ...l, doorState: nextState };
        }
        return l;
      })
    );
  };

  const handleResetLocker = (lockerId: string) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id === lockerId) {
          return {
            ...l,
            status: 'available',
            orderId: undefined,
            orderNumber: undefined,
            assignedAt: undefined,
            doorState: 'locked',
          };
        }
        return l;
      })
    );
    addToast('success', 'Compartment released & returned to available pool.');
  };

  const handleSetMaintenance = (lockerId: string) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id === lockerId) {
          const newStatus = l.status === 'out_of_service' ? 'available' : 'out_of_service';
          return { ...l, status: newStatus };
        }
        return l;
      })
    );
    addToast('info', 'Locker maintenance status updated.');
  };

  const handleEmergencyUnlockAll = () => {
    setLockers((prev) => prev.map((l) => ({ ...l, doorState: 'unlocked' })));
    addToast('warning', 'EMERGENCY OVERRIDE: All 12 locker compartments unlocked.');
  };

  // Product management actions
  const handleSaveProduct = (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = products.map((p) => (p.id === product.id ? product : p));
      addToast('success', `${product.name} updated successfully.`);
    } else {
      updated = [product, ...products];
      addToast('success', `${product.name} added to catalog.`);
    }
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    onUpdateProducts(updated);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, stock: newStock } : p
    );
    onUpdateProducts(updated);
  };

  // Category management actions
  const handleSaveCategory = (cat: CategoryItem) => {
    const exists = categories.some((c) => c.id === cat.id);
    if (exists) {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    } else {
      setCategories((prev) => [cat, ...prev]);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // Webhook test launcher
  const handleTriggerWebhookTest = (orderNumber: string, outcome: 'captured' | 'failed') => {
    const foundOrder = orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
    if (!foundOrder) {
      addToast('error', `Order ${orderNumber} not found.`);
      return;
    }

    if (outcome === 'captured') {
      handleUpdateOrderStatus(foundOrder.id, 'paid');
      if (!foundOrder.lockerNumber) {
        const freeLocker = lockers.find((l) => l.status === 'available');
        if (freeLocker) {
          setLockers((prev) =>
            prev.map((l) =>
              l.id === freeLocker.id
                ? {
                    ...l,
                    status: 'occupied',
                    orderId: foundOrder.id,
                    orderNumber: foundOrder.orderNumber,
                    assignedAt: 'Just Now',
                  }
                : l
            )
          );
          setOrders((prev) =>
            prev.map((o) =>
              o.id === foundOrder.id ? { ...o, lockerNumber: freeLocker.name || freeLocker.number } : o
            )
          );
        }
      }
      addToast('success', `Simulated Webhook Captured: ${foundOrder.orderNumber} marked PAID!`);
    } else {
      handleUpdateOrderStatus(foundOrder.id, 'needs_review');
      addToast('warning', `Simulated Webhook Discrepancy: ${foundOrder.orderNumber} flagged!`);
    }
  };

  const handleSimulateNewOrder = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `ORD${randomNum}`,
      items: [
        { product: products[0] || INITIAL_PRODUCTS[0], quantity: 1 },
        { product: products[1] || INITIAL_PRODUCTS[1], quantity: 1 },
      ],
      totalPaise: 7000,
      status: 'unpaid',
      createdAt: 'Just now',
      expiresInSeconds: 120,
      expiresAt: Date.now() + 120000,
      timeline: [
        { title: 'Order Generated', time: 'Just now', completed: true },
        { title: 'Awaiting Webhook Payment', time: 'Just now', completed: false },
      ],
    };
    setOrders((prev) => [newOrder, ...prev]);
    addToast('success', `Simulated new incoming customer order #${newOrder.orderNumber}`);
  };

  const handleResetSeedData = () => {
    setOrders(INITIAL_ADMIN_ORDERS);
    setLockers(INITIAL_LOCKERS);
    setCategories(INITIAL_CATEGORIES);
    onUpdateProducts(INITIAL_PRODUCTS);
    addToast('info', 'Demo inventory, categories and lockers restored to default seed.');
  };

  // Navigation Items
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'categories', label: 'Category Master', icon: Layers },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: Receipt },
    { key: 'lockers', label: 'Locker Status', icon: Box },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  // Unread notification count
  const unreadCount = unreadNotifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setUnreadNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // If unauthenticated, show professional Admin Login screen
  if (!isAuthenticated) {
    return (
      <>
        <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToKiosk={onGoToCustomerKiosk} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9F3] text-[#3D4127] flex select-none">
      {/* 1. Sticky Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#222514] text-[#D4DE95] border-r border-[#32361D] shrink-0 select-none z-20">
        {/* Brand Logo */}
        <div className="p-6 border-b border-[#32361D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#636B2F] flex items-center justify-center text-white shadow-md shadow-black/40">
              <span className="text-xl">🍿</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight">QuickPick</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#636B2F] text-white text-[9px] font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-[#BAC095] font-semibold mt-0.5">
                Counter Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu with Clear Active States */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#636B2F] text-white shadow-md shadow-black/30 translate-x-1'
                    : 'text-[#BAC095] hover:text-white hover:bg-[#2C301A]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#BAC095]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Return to Customer Kiosk */}
        <div className="p-4 border-t border-[#32361D] space-y-3">
          <button
            type="button"
            onClick={onGoToCustomerKiosk}
            className="w-full py-2.5 px-3.5 rounded-2xl bg-[#2C301A] hover:bg-[#373C21] active:scale-95 text-[#D4DE95] text-xs font-bold border border-[#3E4324] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D4DE95]" />
            <span>Customer Kiosk Mode</span>
          </button>

          <div className="px-2 py-1 text-[11px] text-[#BAC095]/80 font-medium flex items-center justify-between">
            <span>Station #01</span>
            <span className="text-[#D4DE95] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4DE95] animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Main Area: Sticky Header + Only Main Scrolls */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#F8F9F3]/95 backdrop-blur-md border-b border-[#E3E6D3] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#BAC095]/60 text-[#3D4127] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Title */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#3D4127]/60">
                <span>Admin</span>
                <span>/</span>
                <span className="text-[#3D4127] font-black capitalize">
                  {activeTab === 'categories' ? 'Category Master' : activeTab}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Notification Icon + Profile Avatar Dropdown */}
          <div className="flex items-center gap-3">
            {/* Customer Screen Switch */}
            <button
              type="button"
              onClick={onGoToCustomerKiosk}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9F3] text-[#3D4127] border border-[#BAC095]/60 font-bold text-xs shadow-xs transition-all items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#636B2F]" />
              <span>Customer Screen</span>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className="relative p-2 rounded-xl bg-white hover:bg-[#F8F9F3] text-[#3D4127] border border-[#BAC095]/60 cursor-pointer shadow-xs transition-all active:scale-95"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#636B2F]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown UI */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-4 border-b border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#3D4127]">System Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-bold text-[#636B2F] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-[#E3E6D3]/60 max-h-80 overflow-y-auto">
                    {unreadNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start gap-3 transition-colors ${
                          notif.read ? 'bg-white opacity-70' : 'bg-[#FAFBF5]'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : notif.type === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notif.type === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : notif.type === 'success' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-[#3D4127] truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-[#3D4127]/50">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-[#3D4127]/70 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-[#E3E6D3] bg-[#FCFDF9] text-center">
                    <button
                      type="button"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs font-bold text-[#636B2F] hover:underline cursor-pointer"
                    >
                      Close Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar with Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white hover:bg-[#F8F9F3] border border-[#BAC095]/60 cursor-pointer shadow-xs transition-all active:scale-95"
              >
                <div className="w-7 h-7 rounded-xl bg-[#636B2F] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {adminUser.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-black text-[#3D4127] leading-tight">
                    {adminUser.name}
                  </div>
                  <div className="text-[10px] text-[#3D4127]/60 leading-tight">
                    {adminUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#3D4127]/60 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-4 border-b border-[#E3E6D3] bg-[#FCFDF9]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#636B2F] text-white flex items-center justify-center text-sm font-black shadow-xs">
                        {adminUser.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#3D4127] truncate">
                          {adminUser.name}
                        </div>
                        <div className="text-[10px] text-[#3D4127]/60 truncate">
                          {adminUser.email}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#F0F2E5] text-[#636B2F] text-[9px] font-black uppercase">
                          {adminUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange('settings');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#3D4127] hover:bg-[#F8F9F3] flex items-center gap-2.5 cursor-pointer text-left transition-colors"
                    >
                      <User className="w-4 h-4 text-[#636B2F]" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onGoToCustomerKiosk();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#3D4127] hover:bg-[#F8F9F3] flex items-center gap-2.5 cursor-pointer text-left transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#636B2F]" />
                      <span>View Customer Screen</span>
                    </button>

                    <div className="border-t border-[#E3E6D3]/60 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out of Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3. Main Dashboard Content Area (ONLY this scrolls) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                orders={orders}
                products={products}
                lockers={lockers}
                onViewOrder={(order) => setSelectedOrderForModal(order)}
                onNavigateTab={(tab) => handleTabChange(tab)}
                onSimulateNewOrder={handleSimulateNewOrder}
              />
            )}

            {activeTab === 'categories' && (
              <AdminCategories
                categories={categories}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                onToast={addToast}
              />
            )}

            {activeTab === 'products' && (
              <AdminProducts
                products={products}
                onOpenAddModal={() => {
                  setSelectedProductForModal(null);
                  setIsProductModalOpen(true);
                }}
                onOpenEditModal={(prod) => {
                  setSelectedProductForModal(prod);
                  setIsProductModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onUpdateStock={handleUpdateStock}
                onToast={addToast}
              />
            )}

            {activeTab === 'orders' && (
              <AdminOrders
                orders={orders}
                onViewOrder={(order) => setSelectedOrderForModal(order)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onToast={addToast}
              />
            )}

            {activeTab === 'lockers' && (
              <AdminLockers
                lockers={lockers}
                onToggleUnlock={handleToggleUnlockLocker}
                onResetLocker={handleResetLocker}
                onSetMaintenance={handleSetMaintenance}
                onEmergencyUnlockAll={handleEmergencyUnlockAll}
                onToast={addToast}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettings
                onTriggerWebhookTest={handleTriggerWebhookTest}
                onResetSeedData={handleResetSeedData}
                onToast={addToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#222514] text-white flex flex-col z-10 p-4 border-r border-[#32361D]">
            <div className="flex items-center justify-between pb-4 border-b border-[#32361D]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍿</span>
                <span className="font-black text-lg text-white">QuickPick Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-[#BAC095] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      handleTabChange(item.key);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
                      isActive ? 'bg-[#636B2F] text-white' : 'text-[#BAC095] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="space-y-2 pt-2 border-t border-[#32361D]">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  onGoToCustomerKiosk();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#2C301A] text-[#D4DE95] text-xs font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-[#D4DE95]" />
                <span>Customer Kiosk Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 px-4 rounded-xl text-red-400 hover:bg-red-950/40 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Order Detail Modal */}
      <AdminOrderDetailModal
        order={selectedOrderForModal}
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onUnlockLocker={(lockerName) => {
          if (lockerName) {
            const l = lockers.find((lock) => lock.name === lockerName);
            if (l) handleToggleUnlockLocker(l.id);
          }
        }}
      />

      {/* Admin Product Create / Edit Modal */}
      <AdminProductModal
        product={selectedProductForModal}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaveProduct={handleSaveProduct}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
