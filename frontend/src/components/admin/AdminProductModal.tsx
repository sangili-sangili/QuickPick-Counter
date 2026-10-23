import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, Upload, Trash2, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Product, CategoryItem } from '../../types';
import { getAdminCategoriesApi, getAdminProductsApi } from '../../services/adminApi';

interface AdminProductModalProps {
  product: Product | null; // null if adding new product
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  categories?: CategoryItem[];
  products?: Product[];
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaveProduct,
  categories = [],
  products = [],
}) => {
  const [loadedCategories, setLoadedCategories] = useState<CategoryItem[]>(categories);
  const [loadedProducts, setLoadedProducts] = useState<Product[]>(products);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Snacks');
  const [categoryId, setCategoryId] = useState<string>('');
  const [regularPriceRupees, setRegularPriceRupees] = useState('35');
  const [offerPriceRupees, setOfferPriceRupees] = useState('30');
  const [stock, setStock] = useState('10');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [image, setImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageHasError, setImageHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Sync / fetch categories from backend category model
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLoadedCategories(categories);
    } else {
      getAdminCategoriesApi().then((cats) => {
        if (cats && cats.length > 0) {
          setLoadedCategories(cats);
        }
      });
    }
  }, [categories, isOpen]);

  // Sync / fetch products from database to extract real photos
  useEffect(() => {
    if (products && products.length > 0) {
      setLoadedProducts(products);
    } else {
      getAdminProductsApi().then((prods) => {
        if (prods && prods.length > 0) {
          setLoadedProducts(prods);
        }
      });
    }
  }, [products, isOpen]);

// Helper to read file as persistent Base64 data URL
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

const getCleanPresetLabel = (name: string): string => {
  const trimmed = name.trim();
  if (/^cocoa/i.test(trimmed)) return 'Cocoa';
  if (/^red\s*bull/i.test(trimmed)) return 'Red Bull';
  if (/^(coca-cola|coke)/i.test(trimmed)) return 'Coke';
  if (/^lay'?s/i.test(trimmed)) return "Lay's";
  if (/^kit\s*kat/i.test(trimmed)) return 'KitKat';
  if (/^oreo/i.test(trimmed)) return 'Oreo';
  if (/^pringles/i.test(trimmed)) return 'Pringles';
  return trimmed.split(' ')[0].replace(/[^a-zA-Z0-9']/g, '') || 'Snack';
};

const STANDARD_LIBRARY_PRESETS = [
  { label: "Lay's", path: '/images/lays.jpg' },
  { label: 'Coke', path: '/images/coke.jpg' },
  { label: 'KitKat', path: '/images/kitkat.jpg' },
  { label: 'Cocoa', path: '/images/cocoa.jpg' },
  { label: 'Oreo', path: '/images/oreo.jpg' },
  { label: 'Pringles', path: '/images/pringles.jpg' },
  { label: 'Red Bull', path: '/images/redbull.jpg' },
];

  // Derive preset snack photos dynamically from database products with guaranteed unique items
  const dbPresetPhotos = useMemo(() => {
    const seenLabels = new Set<string>();
    const seenPaths = new Set<string>();
    const photos: { label: string; path: string }[] = [];

    // 1. First extract unique photos from database products
    loadedProducts.forEach((p) => {
      const img = p.image;
      if (isValidPersistentImageUrl(img)) {
        const label = getCleanPresetLabel(p.name);
        if (!seenPaths.has(img) && !seenLabels.has(label)) {
          seenPaths.add(img);
          seenLabels.add(label);
          photos.push({ label, path: img });
        }
      }
    });

    // 2. Ensure standard library presets are available so admin has complete snack options
    STANDARD_LIBRARY_PRESETS.forEach((std) => {
      if (!seenPaths.has(std.path) && !seenLabels.has(std.label)) {
        seenPaths.add(std.path);
        seenLabels.add(std.label);
        photos.push(std);
      }
    });

    return photos;
  }, [loadedProducts]);

  useEffect(() => {
    setImageHasError(false);
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setCategoryId(product.categoryId || '');
      const reg = product.regularPricePaise ? product.regularPricePaise : product.pricePaise;
      const off = product.offerPricePaise ? product.offerPricePaise : product.pricePaise;
      setRegularPriceRupees((reg / 100).toString());
      setOfferPriceRupees((off / 100).toString());
      setStock(product.stock.toString());
      setSubtitle(product.subtitle || '');
      setBadge(product.badge || '');
      const initialImg = isValidPersistentImageUrl(product.image)
        ? product.image
        : (dbPresetPhotos[0]?.path || '/images/lays.jpg');
      setImage(initialImg);
      setGalleryImages(
        (product.galleryImages || []).filter((g) => isValidPersistentImageUrl(g))
      );
      setDescription(product.description || '');
      setIsActive(product.isActive !== false);
    } else {
      setName('');
      const defaultCat = (loadedCategories && loadedCategories.length > 0 ? loadedCategories[0].name : 'Snacks');
      const defaultCatId = (loadedCategories && loadedCategories.length > 0 ? loadedCategories[0].id : '');
      setCategory(defaultCat);
      setCategoryId(defaultCatId);
      setRegularPriceRupees('40');
      setOfferPriceRupees('35');
      setStock('12');
      setSubtitle('');
      setBadge('');
      setImage(dbPresetPhotos[0]?.path || '/images/lays.jpg');
      setGalleryImages([]);
      setDescription('');
      setIsActive(true);
    }
    setErrorMessage('');
  }, [product, isOpen, loadedCategories, dbPresetPhotos]);

  if (!isOpen) return null;

  // Primary image file handler (converts to persistent Base64 Data URL)
  const handlePrimaryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64Url = await readFileAsDataUrl(file);
        setImage(base64Url);
        setImageHasError(false);
      } catch (err) {
        console.error('Failed to read image file:', err);
      }
    }
  };

  // Gallery images file handler (converts to persistent Base64 Data URLs)
  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const base64Urls = await Promise.all(
          Array.from(files).map((f) => readFileAsDataUrl(f))
        );
        setGalleryImages((prev) => [...prev, ...base64Urls]);
      } catch (err) {
        console.error('Failed to read gallery files:', err);
      }
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    const regRupees = parseFloat(regularPriceRupees);
    const offRupees = parseFloat(offerPriceRupees);

    if (isNaN(regRupees) || regRupees <= 0) {
      setErrorMessage('Please enter a valid regular price.');
      return;
    }

    if (isNaN(offRupees) || offRupees <= 0) {
      setErrorMessage('Please enter a valid offer price.');
      return;
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMessage('Please enter a valid stock quantity.');
      return;
    }

    const regularPricePaise = Math.round(regRupees * 100);
    const offerPricePaise = Math.round(offRupees * 100);

    const updatedProduct: Product = {
      id: product ? product.id : `prod_${Date.now()}`,
      name: name.trim(),
      category,
      categoryId: categoryId || loadedCategories.find((c) => c.name === category)?.id,
      pricePaise: offerPricePaise, // active checkout price
      regularPricePaise,
      offerPricePaise,
      stock: stockNum,
      subtitle: subtitle.trim() || undefined,
      badge: badge.trim() || undefined,
      badgeType: product?.badgeType || 'green',
      image,
      galleryImages,
      description: description.trim() || undefined,
      isActive,
      rating: product?.rating ?? 4.8,
      ratingCount: product?.ratingCount ?? 45,
    };

    onSaveProduct(updatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E3E6D3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E3E6D3] bg-[#FCFDF9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#636B2F]/10 border border-[#636B2F]/20 flex items-center justify-center text-[#636B2F]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#3D4127]">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-[11px] text-[#3D4127]/60 font-medium">
                Configure snack catalog details, pricing, stock, and gallery photos
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lay's Classic Salted"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setCategory(selectedName);
                  const matchingCat = loadedCategories.find((c) => c.name === selectedName);
                  if (matchingCat) {
                    setCategoryId(matchingCat.id);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] cursor-pointer"
              >
                {loadedCategories && loadedCategories.length > 0 ? (
                  loadedCategories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Biscuits">Biscuits</option>
                    <option value="Combos">Combos</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Pricing & Stock Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
                Regular Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={regularPriceRupees}
                onChange={(e) => setRegularPriceRupees(e.target.value)}
                placeholder="40"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
                Offer Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={offerPriceRupees}
                onChange={(e) => setOfferPriceRupees(e.target.value)}
                placeholder="35"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Fresh and crispy snack description..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#BAC095] text-xs sm:text-sm text-[#3D4127] focus:outline-none focus:ring-2 focus:ring-[#636B2F]/30 focus:border-[#636B2F] resize-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#FCFDF9] border border-[#E3E6D3] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#3D4127]">Catalog Availability</span>
              <p className="text-[11px] text-[#3D4127]/60">
                Active products appear on customer kiosk ordering screens.
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

          {/* Primary Image Upload Area */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#3D4127]/80 mb-1.5">
              Primary Product Image
            </label>
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3]">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#BAC095]/40 flex items-center justify-center shrink-0">
                {image && isValidPersistentImageUrl(image) && !imageHasError ? (
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={() => setImageHasError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#3D4127]/40">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[9px] font-semibold mt-0.5">Photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={primaryFileInputRef}
                  onChange={handlePrimaryFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => primaryFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#BAC095] text-xs font-bold text-[#636B2F] hover:bg-[#F0F2E5] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Main Photo</span>
                </button>
                <p className="text-[10px] text-[#3D4127]/60">
                  Select a local file or pick a quick preset below
                </p>
              </div>
            </div>

            {/* Presets from Database Products */}
            {dbPresetPhotos.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                {dbPresetPhotos.map((preset) => (
                  <button
                    key={preset.path}
                    type="button"
                    onClick={() => {
                      setImage(preset.path);
                      setImageHasError(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      image === preset.path
                        ? 'bg-[#636B2F] text-white border-[#636B2F] shadow-xs'
                        : 'bg-white text-[#3D4127] border-[#BAC095]/60 hover:bg-[#F8F9F3]'
                    }`}
                  >
                    <img
                      src={preset.path}
                      alt={preset.label}
                      className="w-4 h-4 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multiple Gallery Image Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#3D4127]/80">
                Additional Gallery Photos ({galleryImages.length})
              </label>
              <input
                type="file"
                ref={galleryFileInputRef}
                onChange={handleGalleryFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                className="text-xs font-bold text-[#636B2F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Photos</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8F9F3] border border-[#E3E6D3] min-h-[90px] flex items-center gap-3 overflow-x-auto">
              {galleryImages.length === 0 ? (
                <div className="text-center w-full py-2">
                  <p className="text-xs text-[#3D4127]/50 font-medium">
                    No extra gallery photos uploaded. Click "Add Photos" to include side-angles or nutritional labels.
                  </p>
                </div>
              ) : (
                galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#BAC095]/40 shrink-0 group"
                  >
                    <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                ))
              )}
            </div>
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
              <span>{product ? 'Save Product' : 'Add Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
