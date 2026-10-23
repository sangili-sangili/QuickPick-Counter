import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Eye } from 'lucide-react';
import { Product } from '../../types';
import { formatRupees } from '../../utils/format';
import { AdminTable, TableColumn } from './AdminTable';
import { AdminProductDetailModal } from './AdminProductDetailModal';

interface AdminProductsProps {
  products: Product[];
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onUpdateStock,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  // Filter products based on category or status filter
  const filteredProducts = products.filter((p) => {
    let matchesFilter = true;
    if (selectedFilter === 'all') {
      matchesFilter = true;
    } else if (selectedFilter === 'low_stock') {
      matchesFilter = p.stock <= 5;
    } else if (selectedFilter === 'inactive') {
      matchesFilter = p.isActive === false;
    } else if (selectedFilter === 'active') {
      matchesFilter = p.isActive !== false;
    } else {
      matchesFilter = p.category.toLowerCase() === selectedFilter.toLowerCase();
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const columns: TableColumn<Product>[] = [
    {
      key: 'image',
      header: 'Thumbnail',
      className: 'w-16',
      render: (p) => (
        <div
          onClick={() => setDetailProduct(p)}
          className="w-11 h-11 rounded-xl overflow-hidden bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-[#636B2F]/30 transition-all"
          title="Click to view photo gallery"
        >
          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      accessor: (p) => p.name,
      render: (p) => (
        <div>
          <div
            onClick={() => setDetailProduct(p)}
            className="font-black text-[#3D4127] text-sm hover:text-[#636B2F] cursor-pointer transition-colors"
          >
            {p.name}
          </div>
          <div className="text-[11px] text-[#3D4127]/60 line-clamp-1">
            {p.subtitle || p.description || 'QuickPick kiosk item'}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      accessor: (p) => p.category,
      render: (p) => (
        <span className="px-2.5 py-1 rounded-lg bg-[#F0F2E5] text-[#3D4127] font-bold text-xs border border-[#BAC095]/40">
          {p.category}
        </span>
      ),
    },
    {
      key: 'regularPrice',
      header: 'Regular Price',
      sortable: true,
      accessor: (p) => (p.regularPricePaise ? p.regularPricePaise : p.pricePaise) / 100,
      render: (p) => {
        const reg = p.regularPricePaise ? p.regularPricePaise : p.pricePaise;
        return (
          <span className="font-semibold text-stone-500 text-xs">
            {formatRupees(reg)}
          </span>
        );
      },
    },
    {
      key: 'offerPrice',
      header: 'Offer Price',
      sortable: true,
      accessor: (p) => (p.offerPricePaise ? p.offerPricePaise : p.pricePaise) / 100,
      render: (p) => {
        const reg = p.regularPricePaise ? p.regularPricePaise : p.pricePaise;
        const off = p.offerPricePaise ? p.offerPricePaise : p.pricePaise;
        const hasDiscount = reg > off;
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-black text-[#3D4127] text-xs sm:text-sm">
              {formatRupees(off)}
            </span>
            {hasDiscount && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                Sale
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      accessor: (p) => p.stock,
      render: (p) => {
        const isLow = p.stock <= 5;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-black text-xs px-2.5 py-1 rounded-lg border ${
                isLow
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-[#F8F9F3] text-[#3D4127] border-[#BAC095]/40'
              }`}
            >
              {p.stock} units
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStock(p.id, p.stock + 5);
                if (onToast) onToast('success', `Restocked ${p.name} (+5 units)`);
              }}
              className="text-[10px] font-bold text-[#636B2F] hover:underline px-1.5 py-0.5 rounded-md bg-[#F0F2E5] border border-[#BAC095]/40 cursor-pointer"
              title="Quick restock +5 units"
            >
              +5
            </button>
            {isLow && (
              <span className="text-[10px] text-amber-700 font-bold hidden sm:inline">
                Low
              </span>
            )}
          </div>
        );
      },
    },

    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (p) => (p.isActive !== false ? 'Active' : 'Inactive'),
      render: (p) =>
        p.isActive !== false ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            Inactive
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-28 text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetailProduct(p);
            }}
            className="p-1.5 rounded-xl border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#636B2F] cursor-pointer shadow-xs active:scale-95 transition-all"
            title="View Product Details & Gallery"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditModal(p);
            }}
            className="p-1.5 rounded-xl border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#636B2F] cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Edit Product"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProductToDelete(p);
            }}
            className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Delete Product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Product Management Table */}
      <AdminTable<Product>
        title="Products Inventory"
        subtitle={`Real-time kiosk snack catalog • ${products.length} total items (${lowStockCount} low stock)`}
        data={filteredProducts}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search products by name or category..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabel="Category"
        filterOptions={[
          { label: 'All Products', value: 'all' },
          { label: 'Low Stock Only (≤ 5)', value: 'low_stock' },
          { label: 'Active Catalog', value: 'active' },
          { label: 'Inactive Items', value: 'inactive' },
          { label: 'Snacks', value: 'snacks' },
          { label: 'Drinks', value: 'drinks' },
          { label: 'Chocolates', value: 'chocolates' },
          { label: 'Biscuits', value: 'biscuits' },
          { label: 'Combos', value: 'combos' },
        ]}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        exportFileName="QuickPick_Products_Inventory"
        onExportSuccess={(filename) => {
          if (onToast) onToast('success', `Exported products catalog to ${filename}`);
        }}
        actionButton={
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        }
        emptyTitle="No Products Found"
        emptyDescription="No snack items match your current search query or filter selection."
      />

      {/* Product Details Modal with Image Slider */}
      <AdminProductDetailModal
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        onEdit={(prod) => {
          onOpenEditModal(prod);
        }}
      />

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#3D4127]">Delete Product?</h3>
              <p className="text-xs text-[#3D4127]/70 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-[#3D4127]">"{productToDelete.name}"</strong>? It will be
                immediately removed from customer kiosk dispensers.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  if (onToast) onToast('info', `Removed "${productToDelete.name}" from inventory.`);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer active:scale-95 shadow-xs"
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
