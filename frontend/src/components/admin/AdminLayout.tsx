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
  Users,
  LogOut,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Order, Product, ToastMessage, CategoryItem, AdminUser, CustomerUser, AdminLocker } from '../../types';
import {
  getAdminProfileApi,
  getAdminNotificationsApi,
  markAllNotificationsReadApi,
  getAdminCategoriesApi,
  createAdminCategoryApi,
  updateAdminCategoryApi,
  deleteAdminCategoryApi,
  getAdminProductsApi,
  createAdminProductApi,
  updateAdminProductApi,
  updateAdminProductStockApi,
  deleteAdminProductApi,
  getAdminOrdersApi,
  updateAdminOrderStatusApi,
  simulateAdminOrderApi,
  simulateAdminWebhookApi,
  deleteAdminOrderApi,
  getAdminLockersApi,
  toggleUnlockLockerApi,
  setLockerMaintenanceApi,
  resetLockerApi,
  emergencyUnlockAllApi,
  getAdminCustomersApi,
  createAdminCustomerApi,
  updateAdminCustomerApi,
  deleteAdminCustomerApi,
  AdminNotification,
} from '../../services/adminApi';
import { AdminDashboard } from './AdminDashboard';
import { AdminCategories } from './AdminCategories';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminLockers } from './AdminLockers';
import { AdminSettings } from './AdminSettings';
import { AdminOrderDetailModal } from './AdminOrderDetailModal';
import { AdminProductModal } from './AdminProductModal';
import { AdminLogin } from './AdminLogin';
import { ToastContainer } from '../common/Toast';

export type AdminTab = 'dashboard' | 'categories' | 'products' | 'orders' | 'customers' | 'lockers' | 'settings';

const VALID_ADMIN_TABS: AdminTab[] = ['dashboard', 'categories', 'products', 'orders', 'customers', 'lockers', 'settings'];

const getTabFromLocation = (pathname: string): AdminTab => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'admin') {
    const subRoute = parts[1].toLowerCase() as AdminTab;
    if (VALID_ADMIN_TABS.includes(subRoute)) {
      return subRoute;
    }
  }
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
    name: 'Administrator',
    role: 'Station Administrator',
    avatar: 'A',
  });

  // Active Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>(() => getTabFromLocation(location.pathname));

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

  // Notifications state from live DB
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<AdminNotification[]>([]);

  // Profile dropdown state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Live Admin Data State (seeded from PostgreSQL via REST APIs)
  const [orders, setOrders] = useState<Order[]>([]);
  const [lockers, setLockers] = useState<AdminLocker[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

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

  // Synchronize all data from PostgreSQL
  const refreshAdminData = async () => {
    if (!sessionStorage.getItem('quickpick_admin_token')) return;
    setIsLoadingData(true);
    try {
      const [profileRes, notifsRes, catsRes, prodsRes, ordsRes, locksRes, custsRes] =
        await Promise.all([
          getAdminProfileApi(),
          getAdminNotificationsApi(),
          getAdminCategoriesApi(),
          getAdminProductsApi(),
          getAdminOrdersApi(),
          getAdminLockersApi(),
          getAdminCustomersApi(),
        ]);

      if (profileRes) {
        setAdminUser(profileRes);
      }
      if (notifsRes) {
        setUnreadNotifications(notifsRes.notifications);
      }
      if (catsRes) {
        setCategories(catsRes);
      }
      if (prodsRes && prodsRes.length > 0) {
        onUpdateProducts(prodsRes);
      }
      if (ordsRes) {
        setOrders(ordsRes);
      }
      if (locksRes) {
        setLockers(locksRes);
      }
      if (custsRes) {
        setCustomers(custsRes);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load data on initial mount or login
  useEffect(() => {
    if (isAuthenticated) {
      refreshAdminData();
    }
  }, [isAuthenticated]);

  // Auth actions
  const handleLoginSuccess = async (user: AdminUser) => {
    setAdminUser(user);
    setIsAuthenticated(true);
    sessionStorage.setItem('quickpick_admin_auth', 'true');
    addToast('success', `Welcome back, ${user.name}! Connected to PostgreSQL.`);
    await refreshAdminData();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('quickpick_admin_auth');
    sessionStorage.removeItem('quickpick_admin_token');
    setIsProfileDropdownOpen(false);
    addToast('info', 'Logged out of Admin Portal.');
  };

  // Notification actions
  const handleMarkAllNotificationsRead = async () => {
    const ok = await markAllNotificationsReadApi();
    if (ok) {
      setUnreadNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      addToast('info', 'All notifications marked as read.');
    }
  };

  // Order actions
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    const ok = await updateAdminOrderStatusApi(orderId, status);
    if (ok) {
      const [updatedOrders, updatedLockers] = await Promise.all([
        getAdminOrdersApi(),
        getAdminLockersApi(),
      ]);
      setOrders(updatedOrders);
      setLockers(updatedLockers);
      addToast('success', `Order status updated to ${status.toUpperCase()} in DB.`);
    } else {
      addToast('error', 'Failed to update order status in backend.');
    }
  };

  const handleSimulateNewOrder = async () => {
    const created = await simulateAdminOrderApi();
    if (created) {
      const [updatedOrders, updatedLockers] = await Promise.all([
        getAdminOrdersApi(),
        getAdminLockersApi(),
      ]);
      setOrders(updatedOrders);
      setLockers(updatedLockers);
      addToast('success', `Simulated order #${created.orderNumber} placed in DB.`);
    } else {
      addToast('error', 'Failed to simulate order in backend.');
    }
  };

  // Locker actions
  const handleToggleUnlockLocker = async (lockerId: string) => {
    const ok = await toggleUnlockLockerApi(lockerId);
    if (ok) {
      const updated = await getAdminLockersApi();
      setLockers(updated);
      const locker = updated.find((l) => l.id === lockerId);
      addToast('info', `${locker?.name || 'Compartment'} door solenoid ${locker?.doorState || 'toggled'}.`);
    } else {
      addToast('error', 'Failed to toggle locker solenoid.');
    }
  };

  const handleResetLocker = async (lockerId: string) => {
    const ok = await resetLockerApi(lockerId);
    if (ok) {
      const updated = await getAdminLockersApi();
      setLockers(updated);
      addToast('success', 'Compartment released & returned to available pool.');
    } else {
      addToast('error', 'Failed to reset compartment.');
    }
  };

  const handleSetMaintenance = async (lockerId: string) => {
    const ok = await setLockerMaintenanceApi(lockerId);
    if (ok) {
      const updated = await getAdminLockersApi();
      setLockers(updated);
      addToast('info', 'Locker maintenance status updated in database.');
    } else {
      addToast('error', 'Failed to toggle maintenance mode.');
    }
  };

  const handleEmergencyUnlockAll = async () => {
    const ok = await emergencyUnlockAllApi();
    if (ok) {
      const updated = await getAdminLockersApi();
      setLockers(updated);
      addToast('warning', 'EMERGENCY OVERRIDE: All compartments unlocked in DB.');
    } else {
      addToast('error', 'Emergency unlock command failed.');
    }
  };

  // Product management actions
  const handleSaveProduct = async (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    let res: Product | null;
    if (exists) {
      res = await updateAdminProductApi(product.id, product);
      if (res) addToast('success', `${product.name} updated in PostgreSQL.`);
    } else {
      res = await createAdminProductApi(product);
      if (res) addToast('success', `${product.name} added to PostgreSQL catalog.`);
    }
    if (res) {
      const refreshed = await getAdminProductsApi();
      onUpdateProducts(refreshed);
    } else {
      addToast('error', 'Failed to save product in database.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await deleteAdminProductApi(productId);
    if (res.success) {
      const refreshed = await getAdminProductsApi();
      onUpdateProducts(refreshed);
      addToast('success', res.message);
    } else {
      addToast('error', res.message);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    const ok = await updateAdminProductStockApi(productId, newStock);
    if (ok) {
      const refreshed = await getAdminProductsApi();
      onUpdateProducts(refreshed);
      addToast('success', 'Physical stock count updated in PostgreSQL.');
    } else {
      addToast('error', 'Failed to update stock.');
    }
  };

  // Category management actions
  const handleSaveCategory = async (cat: CategoryItem) => {
    const exists = categories.some((c) => c.id === cat.id);
    let res: CategoryItem | null;
    if (exists) {
      res = await updateAdminCategoryApi(cat.id, cat);
      if (res) addToast('success', `Category "${cat.name}" updated.`);
    } else {
      res = await createAdminCategoryApi(cat);
      if (res) addToast('success', `Category "${cat.name}" created.`);
    }
    if (res) {
      const refreshed = await getAdminCategoriesApi();
      setCategories(refreshed);
    } else {
      addToast('error', 'Failed to save category in database.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const res = await deleteAdminCategoryApi(categoryId);
    if (res.success) {
      const refreshed = await getAdminCategoriesApi();
      setCategories(refreshed);
      addToast('success', res.message);
    } else {
      addToast('error', res.message);
    }
  };

  // Real backend signed webhook test launcher
  const handleTriggerWebhookTest = async (orderNumber: string, outcome: 'captured' | 'failed') => {
    const res = await simulateAdminWebhookApi(orderNumber, outcome);
    if (res.success) {
      addToast(
        outcome === 'captured' ? 'success' : 'warning',
        res.message || `Signed webhook dispatched for #${orderNumber}`
      );
      await refreshAdminData();
    } else {
      addToast('error', res.message || 'Webhook simulation failed.');
    }
  };

  const handleResetSeedData = async () => {
    await refreshAdminData();
    addToast('info', 'Synchronized live inventory, categories and lockers from PostgreSQL.');
  };

  // Customer management actions
  const handleAddCustomer = async (newCust: CustomerUser) => {
    const res = await createAdminCustomerApi(newCust);
    if (res) {
      const refreshed = await getAdminCustomersApi();
      setCustomers(refreshed);
      addToast('success', `Customer ${newCust.name} created in PostgreSQL.`);
    } else {
      addToast('error', 'Failed to register customer in database.');
    }
  };

  const handleUpdateCustomer = async (updatedCust: CustomerUser) => {
    const ok = await updateAdminCustomerApi(updatedCust.id, updatedCust);
    if (ok) {
      const refreshed = await getAdminCustomersApi();
      setCustomers(refreshed);
      addToast('info', `Customer ${updatedCust.name} profile updated in DB.`);
    } else {
      addToast('error', 'Failed to update customer in database.');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const res = await deleteAdminCustomerApi(customerId);
    if (res.success) {
      const refreshed = await getAdminCustomersApi();
      setCustomers(refreshed);
      addToast('success', res.message);
    } else {
      addToast('error', res.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await deleteAdminOrderApi(orderId);
    if (res.success) {
      const [refreshedOrders, refreshedLockers] = await Promise.all([
        getAdminOrdersApi(),
        getAdminLockersApi(),
      ]);
      setOrders(refreshedOrders);
      setLockers(refreshedLockers);
      addToast('success', res.message);
    } else {
      addToast('error', res.message);
    }
  };

  // Navigation Items
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'categories', label: 'Category Master', icon: Layers },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: Receipt },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'lockers', label: 'Locker Status', icon: Box },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  // Unread notification count
  const unreadCount = unreadNotifications.filter((n) => !n.read).length;

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
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-[#3D4127]/60 truncate">
                <span>Admin</span>
                <span className="text-[#3D4127]/40">/</span>
                <span className="text-[#3D4127] font-black capitalize truncate">
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

            {/* Sync DB Button */}
            <button
              type="button"
              onClick={refreshAdminData}
              disabled={isLoadingData}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9F3] text-[#3D4127] border border-[#BAC095]/60 font-bold text-xs shadow-xs transition-all items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Synchronize live PostgreSQL database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#636B2F] ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>{isLoadingData ? 'Syncing...' : 'Sync DB'}</span>
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
                <>
                  <div
                    className="fixed inset-0 z-30 bg-black/20 sm:hidden"
                    onClick={() => setIsNotificationOpen(false)}
                  />
                  <div className="fixed inset-x-2.5 top-16 sm:absolute sm:top-full sm:right-0 sm:inset-x-auto sm:w-96 sm:mt-2 bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
                    <div className="p-4 border-b border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between shrink-0">
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

                  <div className="p-3 border-t border-[#E3E6D3] bg-[#FCFDF9] text-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs font-bold text-[#636B2F] hover:underline cursor-pointer"
                    >
                      Close Notifications
                    </button>
                  </div>
                </div>
              </>
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
                <>
                  <div
                    className="fixed inset-0 z-30 bg-black/20 sm:hidden"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="fixed inset-x-3 top-16 sm:absolute sm:top-full sm:right-0 sm:inset-x-auto sm:w-64 sm:mt-2 bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                </>
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
                categories={categories}
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
                onDeleteOrder={handleDeleteOrder}
                onToast={addToast}
              />
            )}

            {activeTab === 'customers' && (
              <AdminCustomers
                customers={customers}
                orders={orders}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onViewOrder={(order) => setSelectedOrderForModal(order)}
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
        categories={categories}
        products={products}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
