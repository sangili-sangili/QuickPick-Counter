import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, AlertTriangle } from 'lucide-react';
import { CategoryItem } from '../../types';
import { AdminTable, TableColumn } from './AdminTable';
import { AdminCategoryModal } from './AdminCategoryModal';

interface AdminCategoriesProps {
  categories: CategoryItem[];
  onSaveCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  onSaveCategory,
  onDeleteCategory,
  onToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // Filtered list
  const filteredCategories = categories.filter((cat) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? cat.isActive
        : !cat.isActive;

    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const columns: TableColumn<CategoryItem>[] = [
    {
      key: 'image',
      header: 'Icon',
      className: 'w-16',
      render: (cat) => (
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F0F2E5] border border-[#BAC095]/40 flex items-center justify-center">
          {cat.image ? (
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/lays.jpg';
              }}
            />
          ) : (
            <Layers className="w-5 h-5 text-[#636B2F]" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      accessor: (cat) => cat.name,
      render: (cat) => (
        <div>
          <div className="font-black text-[#3D4127] text-sm">{cat.name}</div>
          <div className="text-[11px] text-[#3D4127]/60 line-clamp-1 max-w-xs">
            {cat.description || 'No description provided'}
          </div>
        </div>
      ),
    },
    {
      key: 'productCount',
      header: 'Assigned Products',
      sortable: true,
      accessor: (cat) => cat.productCount ?? 0,
      render: (cat) => (
        <span className="px-2.5 py-1 rounded-lg bg-[#F0F2E5] text-[#3D4127] font-bold text-xs border border-[#BAC095]/40">
          {cat.productCount ?? 0} items
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (cat) => (cat.isActive ? 'Active' : 'Inactive'),
      render: (cat) =>
        cat.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            Inactive
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: true,
      accessor: (cat) => cat.createdAt ?? '',
      render: (cat) => (
        <span className="text-xs text-[#3D4127]/70 font-medium">
          {cat.createdAt || 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-28 text-right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(cat);
              setIsModalOpen(true);
            }}
            className="p-1.5 rounded-xl border border-[#BAC095]/60 hover:bg-[#F8F9F3] text-[#636B2F] cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Edit Category"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCategoryToDelete(cat);
            }}
            className="p-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Category Management Table */}
      <AdminTable<CategoryItem>
        title="Category Master"
        subtitle="Manage food & beverage product classifications displayed across customer kiosks"
        data={filteredCategories}
        columns={columns}
        keyExtractor={(cat) => cat.id}
        searchPlaceholder="Search categories by name or description..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabel="Status"
        filterOptions={[
          { label: 'All Categories', value: 'all' },
          { label: 'Active Only', value: 'active' },
          { label: 'Inactive Only', value: 'inactive' },
        ]}
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        exportFileName="QuickPick_Categories"
        onExportSuccess={(filename) => {
          onToast('success', `Exported categories to ${filename}`);
        }}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        }
        emptyTitle="No Categories Found"
        emptyDescription="Create your first kiosk category using the Add Category button above."
      />

      {/* Add / Edit Category Modal */}
      <AdminCategoryModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveCategory={(cat) => {
          onSaveCategory(cat);
          onToast('success', `Category "${cat.name}" saved successfully.`);
        }}
        existingCategories={categories}
      />

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#3D4127]">Delete Category?</h3>
              <p className="text-xs text-[#3D4127]/70 mt-1">
                Are you sure you want to delete{' '}
                <strong className="text-[#3D4127]">"{categoryToDelete.name}"</strong>?
              </p>
            </div>

            {/* Entity Details Card */}
            <div className="p-3 rounded-2xl bg-[#F8F9F3] border border-[#BAC095]/40 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-[#BAC095]/40 shrink-0 flex items-center justify-center">
                {categoryToDelete.image ? (
                  <img
                    src={categoryToDelete.image}
                    alt={categoryToDelete.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/lays.jpg';
                    }}
                  />
                ) : (
                  <Layers className="w-5 h-5 text-[#636B2F]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-[#3D4127] truncate">
                  {categoryToDelete.name}
                </div>
                <div className="text-[10px] text-[#3D4127]/60">
                  {categoryToDelete.productCount ?? 0} assigned products
                </div>
              </div>
            </div>

            {/* Foreign Key Warning Banner */}
            {(categoryToDelete.productCount ?? 0) > 0 ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Foreign Key Constraint</span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  This category has <strong>{categoryToDelete.productCount}</strong> linked product(s). Relational protection will block deletion until these products are reassigned or removed.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500">
                This category has 0 assigned products and can be safely deleted.
              </p>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] hover:bg-stone-50 cursor-pointer flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
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
