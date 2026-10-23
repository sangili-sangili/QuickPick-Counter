import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Upload, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
import { CategoryItem } from '../../types';
import { getAdminCategoriesApi } from '../../services/adminApi';

interface AdminCategoryModalProps {
  category: CategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (category: CategoryItem) => void;
  existingCategories?: CategoryItem[];
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const isValidPersistentImageUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false; // Exclude session-bound temporary blob URLs
  return (
    url.startsWith('/images/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:image/')
  );
};

const STANDARD_CATEGORY_LIBRARY = [
  { name: 'Snacks', url: '/images/lays.jpg' },
  { name: 'Drinks', url: '/images/coke.jpg' },
  { name: 'Chocolates', url: '/images/kitkat.jpg' },
  { name: 'Dark Cocoa', url: '/images/cocoa.jpg' },
  { name: 'Biscuits', url: '/images/oreo.jpg' },
  { name: 'Crisps', url: '/images/pringles.jpg' },
  { name: 'Combos', url: '/images/hero-snacks.jpg' },
];

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onSaveCategory,
  existingCategories = [],
}) => {
  const [loadedCategories, setLoadedCategories] = useState<CategoryItem[]>(existingCategories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/images/lays.jpg');
  const [isActive, setIsActive] = useState(true);
  const [imageHasError, setImageHasError] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync / fetch categories from backend database model
  useEffect(() => {
    if (existingCategories && existingCategories.length > 0) {
      setLoadedCategories(existingCategories);
    } else {
      getAdminCategoriesApi().then((cats) => {
        if (cats && cats.length > 0) {
          setLoadedCategories(cats);
        }
      });
    }
  }, [existingCategories, isOpen]);

  // Derive presets dynamically from database categories (strictly unique names & paths)
  const dbPresetCategoryImages = useMemo(() => {
    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();
    const presets: { name: string; url: string }[] = [];

    // 1. First extract from active database categories
    loadedCategories.forEach((cat) => {
      if (isValidPersistentImageUrl(cat.image) && !seenUrls.has(cat.image) && !seenNames.has(cat.name)) {
        seenUrls.add(cat.image);
        seenNames.add(cat.name);
        presets.push({ name: cat.name, url: cat.image });
      }
    });

    // 2. Supplement standard local static image library if not already present
    STANDARD_CATEGORY_LIBRARY.forEach((std) => {
      if (!seenUrls.has(std.url) && !seenNames.has(std.name)) {
        seenUrls.add(std.url);
        seenNames.add(std.name);
        presets.push(std);
      }
    });

    return presets;
  }, [loadedCategories]);

  useEffect(() => {
    setImageHasError(false);
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      const initialImg = isValidPersistentImageUrl(category.image)
        ? category.image
        : (dbPresetCategoryImages[0]?.url || '/images/lays.jpg');
      setImage(initialImg);
      setIsActive(category.isActive ?? true);
    } else {
      setName('');
      setDescription('');
      setImage(dbPresetCategoryImages[0]?.url || '/images/lays.jpg');
      setIsActive(true);
    }
    setError('');
  }, [category, isOpen, dbPresetCategoryImages]);

  if (!isOpen) return null;

  // File upload converting to persistent Base64 Data URL
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Url = await readFileAsDataUrl(file);
        setImage(base64Url);
        setImageHasError(false);
      } catch (err) {
        console.error('Failed to read category image file:', err);
      }
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
                {image && isValidPersistentImageUrl(image) && !imageHasError ? (
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageHasError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#3D4127]/40">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[9px] font-semibold mt-0.5">Icon</span>
                  </div>
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
                  Select a local file or choose one of the database category icons below
                </p>
              </div>
            </div>

            {/* Presets dynamically derived from DB */}
            {dbPresetCategoryImages.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                {dbPresetCategoryImages.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setImage(preset.url);
                      setImageHasError(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      image === preset.url
                        ? 'bg-[#636B2F] text-white border-[#636B2F] shadow-xs'
                        : 'bg-white text-[#3D4127] border-[#BAC095]/60 hover:bg-[#F8F9F3]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-4 h-4 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
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
