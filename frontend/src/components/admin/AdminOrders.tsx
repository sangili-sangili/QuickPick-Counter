import React, { useState } from 'react';
import { Eye, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';
import { formatRupees } from '../../utils/format';
import { AdminTable, TableColumn } from './AdminTable';

interface AdminOrdersProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteOrder?: (orderId: string) => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onViewOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.lockerNumber && o.lockerNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.items.some((i) => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Expired
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Needs Review
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Claimed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  const columns: TableColumn<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order ID',
      sortable: true,
      accessor: (o) => o.orderNumber,
      render: (o) => (
        <span
          onClick={() => onViewOrder(o)}
          className="font-black text-[#3D4127] text-xs hover:text-[#636B2F] cursor-pointer"
        >
          {o.orderNumber}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Snacks Breakdown',
      accessor: (o) => o.items.map((i) => `${i.product.name} (x${i.quantity})`).join('; '),
      render: (o) => (
        <div className="space-y-0.5">
          <div className="font-medium text-[#3D4127] text-xs truncate max-w-xs">
            {o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
          </div>
          <div className="text-[10px] text-[#3D4127]/60">
            {o.items.reduce((s, it) => s + it.quantity, 0)} total snack items
          </div>
        </div>
      ),
    },
    {
      key: 'totalPaise',
      header: 'Amount',
      sortable: true,
      accessor: (o) => o.totalPaise / 100,
      render: (o) => (
        <span className="font-black text-[#3D4127] text-xs sm:text-sm">
          {formatRupees(o.totalPaise)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (o) => o.status,
      render: (o) => getStatusBadge(o.status),
    },
    {
      key: 'lockerNumber',
      header: 'Compartment',
      sortable: true,
      accessor: (o) => o.lockerNumber || 'Unassigned',
      render: (o) => (
        <span className="px-2.5 py-1 rounded-lg bg-[#F0F2E5] text-[#3D4127] font-bold text-xs border border-[#BAC095]/40">
          {o.lockerNumber || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      accessor: (o) => o.createdAt,
      render: (o) => <span className="text-xs text-[#3D4127]/70">{o.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-36 text-right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          {o.status === 'unpaid' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateOrderStatus(o.id, 'paid');
              }}
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1"
              title="Mark Paid & Dispense"
            >
              <Check className="w-3 h-3" />
              <span>Paid</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrder(o);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#636B2F] font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1"
            title="View Order Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOrderToDelete(o);
            }}
            className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center"
            title="Delete Order"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminTable<Order>
        title="Orders Management"
        subtitle={`Tracking ${orders.length} transactions across kiosk self-service station`}
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id}
        searchPlaceholder="Search by Order ID, snack name, or locker..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabel="Status"
        filterOptions={[
          { label: 'All Orders', value: 'all' },
          { label: 'Paid Orders', value: 'paid' },
          { label: 'Pending (120s Hold)', value: 'unpaid' },
          { label: 'Claimed / Picked Up', value: 'claimed' },
          { label: 'Expired', value: 'expired' },
          { label: 'Needs Review', value: 'needs_review' },
        ]}
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        exportFileName="QuickPick_Orders_Report"
        onExportSuccess={(filename) => {
          if (onToast) onToast('success', `Exported orders log to ${filename}`);
        }}
        emptyTitle="No Orders Found"
        emptyDescription="No customer orders match the current search query or status filter."
      />

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#3D4127]">Delete Order Record?</h3>
              <p className="text-xs text-[#3D4127]/70 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-[#3D4127]">#{orderToDelete.orderNumber}</strong>?
              </p>
            </div>

            {/* Order Details Preview */}
            <div className="p-3.5 rounded-2xl bg-[#F8F9F3] border border-[#BAC095]/40 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#3D4127]">#{orderToDelete.orderNumber}</span>
                <span className="font-black text-[#3D4127] text-xs sm:text-sm">
                  {formatRupees(orderToDelete.totalPaise)}
                </span>
              </div>
              <div className="text-[11px] text-[#3D4127]/80 line-clamp-2">
                {orderToDelete.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#3D4127]/60 pt-1 border-t border-[#BAC095]/30">
                <span>Compartment: {orderToDelete.lockerNumber || 'Unassigned'}</span>
                <span className="uppercase font-bold tracking-wider">{orderToDelete.status}</span>
              </div>
            </div>

            {/* Active Order / Locker Hold Warning */}
            {orderToDelete.status === 'paid' || orderToDelete.status === 'unpaid' ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Active Transaction Guard</span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  This order is currently <strong>{orderToDelete.status.toUpperCase()}</strong> with compartment <strong>{orderToDelete.lockerNumber || 'hold'}</strong>. The system service will block deleting active locker reservations and payment records.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500">
                This {orderToDelete.status} order record can be purged if no foreign key payment webhook logs exist.
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] hover:bg-stone-50 cursor-pointer flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder) onDeleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
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
