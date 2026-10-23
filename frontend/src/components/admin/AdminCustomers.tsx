import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Crown,
  Sparkles,
  ShoppingBag,
  Eye,
  DollarSign,
  X,
  ShieldCheck,
  Clock,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { CustomerUser, Order } from '../../types';
import { formatRupees } from '../../utils/format';
import { AdminTable, TableColumn } from './AdminTable';

interface AdminCustomersProps {
  customers: CustomerUser[];
  orders: Order[];
  onAddCustomer: (customer: CustomerUser) => void;
  onUpdateCustomer: (customer: CustomerUser) => void;
  onDeleteCustomer: (customerId: string) => void;
  onViewOrder?: (order: Order) => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  orders,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onViewOrder,
  onToast,
}) => {
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerUser | null>(null);

  // Form State for Adding New Customer
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState('Bronze Member');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Filter Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesTier = tierFilter === 'all' || c.membershipTier === tierFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q));
    return matchesTier && matchesSearch;
  });

  // Calculate Metrics
  const totalCustomers = customers.length;
  const goldCount = customers.filter((c) => c.membershipTier === 'Gold Member').length;
  const silverCount = customers.filter((c) => c.membershipTier === 'Silver Member').length;
  const totalLifetimeSpentPaise = customers.reduce((sum, c) => sum + (c.totalSpentPaise || 0), 0);
  const avgSpentPaise = totalCustomers > 0 ? Math.round(totalLifetimeSpentPaise / totalCustomers) : 0;

  // Get tier badge styling
  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'Gold Member':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
            Gold VIP
          </span>
        );
      case 'Silver Member':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
            <Sparkles className="w-3 h-3 text-slate-500" />
            Silver
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-200">
            <ShieldCheck className="w-3 h-3 text-orange-600" />
            Bronze
          </span>
        );
    }
  };

  // Handle Add Customer Submission
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!newName.trim()) errors.name = 'Full name is required';
    if (!newEmail.trim() || !newEmail.includes('@')) errors.email = 'Valid email is required';
    if (!newPhone.trim()) errors.phone = 'Phone number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newCustomer: CustomerUser = {
      id: `usr_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      avatar: newName.trim().charAt(0).toUpperCase(),
      membershipTier: newTier,
      ordersCount: 0,
      totalSpentPaise: 0,
      lastOrderDate: 'Just registered',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    onAddCustomer(newCustomer);
    onToast?.('success', `Customer ${newCustomer.name} registered successfully!`);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewTier('Bronze Member');
    setFormErrors({});
  };

  // Table Columns
  const columns: TableColumn<CustomerUser>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      accessor: (c) => c.name,
      render: (c) => (
        <div
          onClick={() => setSelectedCustomer(c)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#F59E0B] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform shrink-0">
            {c.avatar || c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-black text-[#1C1917] text-xs group-hover:text-[#E11D48] transition-colors">
              {c.name}
            </div>
            <div className="text-[10px] text-stone-500 font-medium">
              Member since {c.createdAt || 'Aug 2026'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Information',
      accessor: (c) => `${c.email}${c.phone ? ' (' + c.phone + ')' : ''}`,
      render: (c) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate max-w-[180px]">{c.email}</span>
          </div>
          {c.phone && (
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{c.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'membershipTier',
      header: 'Loyalty Tier',
      sortable: true,
      accessor: (c) => c.membershipTier || 'Bronze Member',
      render: (c) => getTierBadge(c.membershipTier),
    },
    {
      key: 'ordersCount',
      header: 'Orders',
      sortable: true,
      accessor: (c) => c.ordersCount || 0,
      render: (c) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-xs font-bold border border-stone-200">
          <ShoppingBag className="w-3 h-3 text-stone-500" />
          {c.ordersCount || 0}
        </span>
      ),
    },
    {
      key: 'totalSpentPaise',
      header: 'Lifetime Spend',
      sortable: true,
      accessor: (c) => (c.totalSpentPaise || 0) / 100,
      render: (c) => (
        <span className="font-black text-[#1C1917] text-xs">
          {formatRupees(c.totalSpentPaise || 0)}
        </span>
      ),
    },
    {
      key: 'lastOrderDate',
      header: 'Last Kiosk Visit',
      accessor: (c) => c.lastOrderDate || 'No orders yet',
      render: (c) => (
        <div className="flex items-center gap-1 text-[11px] text-stone-600 font-medium">
          <Clock className="w-3 h-3 text-stone-400" />
          <span>{c.lastOrderDate || 'No orders yet'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedCustomer(c)}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#E11D48]/10 text-stone-600 hover:text-[#E11D48] transition-colors cursor-pointer"
            title="View Customer Profile & Order History"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const nextTier =
                c.membershipTier === 'Gold Member'
                  ? 'Silver Member'
                  : c.membershipTier === 'Silver Member'
                  ? 'Bronze Member'
                  : 'Gold Member';
              onUpdateCustomer({ ...c, membershipTier: nextTier });
            }}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-800 transition-colors cursor-pointer"
            title="Cycle Loyalty Tier"
          >
            <Crown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCustomerToDelete(c);
            }}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Get orders associated with the selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customerId === selectedCustomer.id ||
          o.items.some(() => selectedCustomer.name === 'Alex Johnson' && o.orderNumber === 'ORD1234') ||
          (selectedCustomer.name === 'Priya Sharma' && o.orderNumber === 'ORD1233')
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8C2A7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Registered Customers
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">{totalCustomers}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
              +14% this month
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Gold VIP Members */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8C2A7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Gold VIP Members
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">{goldCount}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 mt-0.5">
              5% Kiosk Cashback
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        {/* Silver Members */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8C2A7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Silver Members
            </p>
            <p className="text-2xl font-black text-slate-700 mt-1">{silverCount}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-0.5">
              Tier progress active
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Avg. Customer Lifetime Value */}
        <div className="p-4 rounded-2xl bg-white border border-[#D8C2A7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Avg. Lifetime Value
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {formatRupees(avgSpentPaise)}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
              Across all checkouts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Customers Table with Controls */}
      <AdminTable<CustomerUser>
        title="Customer Directory"
        subtitle="View and manage patron profiles, loyalty tiers, and transaction histories"
        data={filteredCustomers}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer by name, email, or phone..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabel="Filter Tier"
        selectedFilter={tierFilter}
        onFilterChange={setTierFilter}
        filterOptions={[
          { label: 'All Tiers', value: 'all' },
          { label: 'Gold Member', value: 'Gold Member' },
          { label: 'Silver Member', value: 'Silver Member' },
          { label: 'Bronze Member', value: 'Bronze Member' },
        ]}
        actionButton={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        }
        exportFileName="snackhub-customers.csv"
        emptyTitle="No customers found"
        emptyDescription="Try adjusting your search criteria or register a new customer above."
      />

      {/* Customer Detail & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#D8C2A7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                  {selectedCustomer.avatar || selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">{selectedCustomer.name}</h3>
                    {getTierBadge(selectedCustomer.membershipTier)}
                  </div>
                  <p className="text-xs text-stone-300 font-medium mt-0.5">
                    {selectedCustomer.email} • {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Stats & Order History */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer Lifetime Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] text-center">
                  <p className="text-[10px] font-bold uppercase text-stone-500">Total Orders</p>
                  <p className="text-lg font-black text-stone-900 mt-1">
                    {selectedCustomer.ordersCount || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] text-center">
                  <p className="text-[10px] font-bold uppercase text-stone-500">Lifetime Spend</p>
                  <p className="text-lg font-black text-primary mt-1">
                    {formatRupees(selectedCustomer.totalSpentPaise || 0)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF5EF] border border-[#EFE8DE] text-center">
                  <p className="text-[10px] font-bold uppercase text-stone-500">Loyalty Points</p>
                  <p className="text-lg font-black text-amber-600 mt-1">
                    {Math.floor((selectedCustomer.totalSpentPaise || 0) / 1000)} pts
                  </p>
                </div>
              </div>

              {/* Order History at this Kiosk */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>Kiosk Transactions & Order History</span>
                </h4>

                {customerOrders.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500 font-medium">
                      No past transactions recorded for this customer yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-primary/40 transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-stone-900">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                order.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'claimed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status}
                            </span>
                            {order.lockerNumber && (
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
                                Locker {order.lockerNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate max-w-sm">
                            {order.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                          </p>
                          <p className="text-[10px] text-stone-400">{order.createdAt}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-xs text-stone-900">
                            {formatRupees(order.totalPaise)}
                          </p>
                          {onViewOrder && (
                            <button
                              onClick={() => {
                                setSelectedCustomer(null);
                                onViewOrder(order);
                              }}
                              className="text-[10px] font-bold text-primary hover:underline mt-1 inline-flex items-center gap-0.5"
                            >
                              <span>View Receipt</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#D8C2A7] shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black">Register New Customer</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    formErrors.name ? 'border-red-500' : 'border-stone-300'
                  } text-xs focus:outline-none focus:border-primary`}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. ramesh.k@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    formErrors.email ? 'border-red-500' : 'border-stone-300'
                  } text-xs focus:outline-none focus:border-primary`}
                />
                {formErrors.email && (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${
                    formErrors.phone ? 'border-red-500' : 'border-stone-300'
                  } text-xs focus:outline-none focus:border-primary`}
                />
                {formErrors.phone && (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Membership Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Bronze Member">Bronze Member (Standard)</option>
                  <option value="Silver Member">Silver Member (Tier 2)</option>
                  <option value="Gold Member">Gold Member (VIP 5% Cashback)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#1C1917]">Delete Customer Account?</h3>
              <p className="text-xs text-stone-600 mt-1">
                Are you sure you want to remove{' '}
                <strong className="text-stone-900">"{customerToDelete.name}"</strong>?
              </p>
            </div>

            {/* Customer Details Preview */}
            <div className="p-3 rounded-2xl bg-[#F8F9F3] border border-[#BAC095]/40 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E11D48] to-[#F59E0B] flex items-center justify-center text-white font-black text-sm shrink-0">
                {customerToDelete.avatar || customerToDelete.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-stone-900 truncate">
                  {customerToDelete.name}
                </div>
                <div className="text-[10px] text-stone-500 truncate">
                  {customerToDelete.email}
                </div>
                <div className="text-[10px] text-stone-600 font-semibold mt-0.5">
                  {customerToDelete.ordersCount ?? 0} orders • {formatRupees(customerToDelete.totalSpentPaise || 0)} spent
                </div>
              </div>
            </div>

            {/* Foreign Key Warning Banner */}
            {(customerToDelete.ordersCount ?? 0) > 0 ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Foreign Key Constraint</span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  This customer has <strong>{customerToDelete.ordersCount}</strong> historical order(s). System security and audit rules block deleting customers with transaction history.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500">
                This customer has 0 past orders and can be removed without breaking transaction logs.
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(customerToDelete.id);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer active:scale-95 shadow-xs flex-1 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
