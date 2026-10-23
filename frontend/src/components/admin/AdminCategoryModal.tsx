import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
import { CategoryItem } from '../../types';

interface AdminCategoryModalProps {
  category: CategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (category: CategoryItem) => void;
}

const PRESET_CATEGORY_IMAGES = [
  { name: 'Snacks / Chips', url: '/images/lays.jpg' },
  { name: 'Cold Drinks', url: '/images/coke.jpg' },
  { name: 'Chocolates', url: '/images/kitkat.jpg' },
  { name: 'Biscuits / Cookies', url: '/images/oreo.jpg' },
  { name: 'Cans / Pringles', url: '/images/pringles.jpg' },
  { name: 'Combos / Meal', url: '/images/hero-snacks.jpg' },
];

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onSaveCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/images/lays.jpg');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setImage(category.image || '/images/lays.jpg');
      setIsActive(category.isActive ?? true);
    } else {
      setName('');
      setDescription('');
      setImage('/images/lays.jpg');
      setIsActive(true);
    }
    setError('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImage(localUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }

    const savedCategory: CategoryItem = {
      id: category ? category.id : `cat_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      image,
      isActive,
      productCount: category ? category.productCount : 0,
      createdAt: category ? category.createdAt : new Date().toISOString().slice(0, 10),
    };

    onSaveCategory(savedCategory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#636B2F]/10 border border-[#636B2F]/20 flex items-center justify-center text-[#636B2F]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#3D4127]">
                {category ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="text-[11px] text-[#3D4127]/60 font-medium">
                Category Master classification for kiosk items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#3D4127]/50 hover:text-[#3D4127] hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Healthy Snacks, Cold Beverages..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description of items in this classification..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] resize-none"
            />
          </div>

          {/* Category Image Upload & Preview */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
              Category Icon / Photo
            </label>
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3]">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#BAC095]/40 flex items-center justify-center shrink-0">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#3D4127]/40" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#BAC095] text-xs font-bold text-[#636B2F] hover:bg-[#F0F2E5] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                </button>
                <p className="text-[10px] text-[#3D4127]/60">
                  Select an image or choose one of the preset snack icons below
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_CATEGORY_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setImage(preset.url)}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                    image === preset.url
                      ? 'bg-[#636B2F] text-white border-[#636B2F]'
                      : 'bg-white text-[#3D4127] border-[#BAC095]/60 hover:bg-[#F8F9F3]'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-3 h-3 object-cover rounded-sm" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active / Inactive Status Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#3D4127]">Active Status</span>
              <p className="text-[11px] text-[#3D4127]/60">
                Inactive categories will be hidden from customer self-service kiosks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? 'bg-[#636B2F]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#BAC095]/60 text-xs font-bold text-[#3D4127] hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#636B2F] hover:bg-[#525926] text-white text-xs font-bold shadow-md shadow-[#636B2F]/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{category ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
