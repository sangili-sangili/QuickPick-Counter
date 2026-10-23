import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/customer/Navbar';
import { HeroBanner } from './components/customer/HeroBanner';
import { CategoryTabs } from './components/customer/CategoryTabs';
import { ProductCard } from './components/customer/ProductCard';
import { ProductDetailsModal } from './components/customer/ProductDetailsModal';
import { AuthModal } from './components/customer/AuthModal';
import { CustomerProfileModal } from './components/customer/CustomerProfileModal';
import { CartModal } from './components/customer/CartPanel';
import { ViewAllScreen } from './components/customer/ViewAllScreen';
import { WishlistModal } from './components/customer/WishlistModal';
import { PaymentScreen } from './components/customer/PaymentScreen';
import { SuccessScreen } from './components/customer/SuccessScreen';
import { Footer } from './components/customer/Footer';
import { ToastContainer } from './components/common/Toast';
import { ConfirmCancelModal } from './components/common/ConfirmCancelModal';
import { StockErrorModal } from './components/common/StockErrorModal';
import { OrderDetailsModal } from './components/common/OrderDetailsModal';
import { HelpModal } from './components/common/HelpModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { Product, CartItem, Order, ToastMessage, CustomerUser, CategoryItem } from './types';
import { formatRupees } from './utils/format';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import {
  fetchProductsAPI,
  fetchCategoriesAPI,
  fetchWishlistAPI,
  addToWishlistAPI,
  removeFromWishlistAPI,
  fetchCartAPI,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  createOrderAPI,
  confirmOrderPaymentAPI,
  claimPickupAPI,
  fetchCustomerProfileAPI,
  customerLogoutAPI,
} from './services/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Live Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Wishlist states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Customer Auth state (persisted across sessions)
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('snackhub_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modal open states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isStockErrorOpen, setIsStockErrorOpen] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Fetching from Database (Active Categories, Products, Profile, Cart, Wishlist)
  useEffect(() => {
    // 1. Fetch Active Categories
    fetchCategoriesAPI().then((cats) => {
      setCategories(cats);
    });

    // 2. Fetch Active Products
    fetchProductsAPI().then((prods) => {
      setProducts(prods);
      setIsLoadingInitial(false);
    });

    // 3. Sync customer profile if logged in
    fetchCustomerProfileAPI().then((prof) => {
      if (prof) {
        setCurrentUser(prof);
        try {
          localStorage.setItem('snackhub_customer', JSON.stringify(prof));
        } catch {}
      }
    });

    // 4. Sync wishlist
    fetchWishlistAPI().then((wProds) => {
      if (wProds && wProds.length > 0) {
        setWishlistIds(wProds.map((p) => p.id));
      }
    });

    // 5. Sync cart
    fetchCartAPI().then((cartData) => {
      if (cartData && cartData.items && cartData.items.length > 0) {
        setCart(
          cartData.items.map((i) => ({
            product: i.product,
            quantity: i.quantity,
          }))
        );
      }
    });
  }, []);

  // Filter products for Home screen (Category & Search)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        prod.category.toLowerCase() === selectedCategory.toLowerCase() ||
        prod.categoryId === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.subtitle && prod.subtitle.toLowerCase().includes(q)) ||
        (prod.description && prod.description.toLowerCase().includes(q)) ||
        prod.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Limit Home Page to top 8 items
  const homeProducts = useMemo(() => filteredProducts.slice(0, 8), [filteredProducts]);

  // Product details modal handlers
  const handleOpenProductDetails = (product: Product) => {
    setSelectedProductForModal(product);
    setIsProductDetailsOpen(true);
  };

  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProductForModal(null);
  };

  // Customer Auth handlers
  const handleLoginSuccess = async (user: CustomerUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('snackhub_customer', JSON.stringify(user));
    } catch {}
    addToast('success', `Welcome, ${user.name}!`);

    // Sync user's saved wishlist and cart from database
    const [serverWishlist, serverCart, freshProfile] = await Promise.all([
      fetchWishlistAPI(),
      fetchCartAPI(),
      fetchCustomerProfileAPI(),
    ]);

    if (freshProfile) {
      setCurrentUser(freshProfile);
    }
    if (serverWishlist && serverWishlist.length > 0) {
      setWishlistIds(serverWishlist.map((p) => p.id));
    }
    if (serverCart && serverCart.items && serverCart.items.length > 0) {
      setCart(
        serverCart.items.map((i) => ({
          product: i.product,
          quantity: i.quantity,
        }))
      );
    }
  };

  const handleLogout = () => {
    customerLogoutAPI();
    setCurrentUser(null);
    setCart([]);
    setWishlistIds([]);
    addToast('info', 'Signed out successfully.');
  };

  // Wishlist API Toggle
  const handleToggleWishlist = async (productId: string) => {
    const isSaved = wishlistIds.includes(productId);
    if (isSaved) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      await removeFromWishlistAPI(productId);
      addToast('info', 'Removed from wishlist');
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      await addToWishlistAPI(productId);
      addToast('success', 'Added to wishlist');
    }
  };

  // Cart API Operations
  const handleAddToCart = async (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= product.stock) {
      setStockErrorMessage(
        product.stock === 1
          ? 'Only 1 unit available for this product.'
          : `Only ${product.stock} units available for this product.`
      );
      setIsStockErrorOpen(true);
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity: 1 }]);
    }

    await addToCartAPI(product.id, 1);
    addToast('success', `${product.name} added to cart`);
  };

  const handleUpdateQuantityFromModal = (product: Product, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(product.id);
      return;
    }

    if (quantity > product.stock) {
      setStockErrorMessage(
        product.stock === 1
          ? 'Only 1 unit available for this product.'
          : `Only ${product.stock} units available for this product.`
      );
      setIsStockErrorOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity } : item
        );
      } else {
        return [...prev, { product, quantity }];
      }
    });

    updateCartItemAPI(product.id, quantity);
    addToast('success', `${product.name} updated in cart`);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && quantity > prod.stock) {
      setStockErrorMessage(
        prod.stock === 1
          ? 'Only 1 unit available for this product.'
          : `Only ${prod.stock} units available for this product.`
      );
      setIsStockErrorOpen(true);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    await updateCartItemAPI(productId, quantity);
  };

  const handleRemoveItem = async (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    await removeCartItemAPI(productId);
  };

  const handleClearCart = async () => {
    setCart([]);
    await clearCartAPI();
  };

  // Order submission & stock hold in Database
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const result = await createOrderAPI({
        items: orderPayload,
        customerId: currentUser?.customerId || currentUser?.id,
      });

      if (!result.success || !result.orderId) {
        throw new Error(result.error || 'Failed to place order');
      }

      const totalPaise =
        result.totalPaise ||
        cart.reduce(
          (sum, item) => sum + item.product.pricePaise * item.quantity,
          0
        );

      const newOrder: Order = {
        id: result.orderId,
        orderNumber: result.orderNumber || `ORD${Math.floor(1000 + Math.random() * 9000)}`,
        items: [...cart],
        totalPaise,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        expiresInSeconds: result.expiresInSeconds || 120,
        expiresAt: Date.now() + (result.expiresInSeconds || 120) * 1000,
        lockerNumber: result.lockerNumber || 'L-01',
      };

      // Refresh product list to show held physical stock
      fetchProductsAPI().then((p) => {
        if (p && p.length > 0) setProducts(p);
      });

      setCurrentOrder(newOrder);
      setIsCartModalOpen(false);
      setCart([]);
      clearCartAPI();
      navigate('/payment');

      addToast('success', `Order #${newOrder.orderNumber} placed! Locker ${newOrder.lockerNumber} reserved.`);
      setTimeout(() => {
        addToast('info', 'Waiting for payment confirmation...');
      }, 700);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Payment Confirmation
  const handlePaymentSuccess = async () => {
    if (!currentOrder) return;

    await confirmOrderPaymentAPI(currentOrder.id);
    setCurrentOrder((prev) => (prev ? { ...prev, status: 'paid' } : null));

    // Refresh user profile if balance or order count changed
    fetchCustomerProfileAPI().then((prof) => {
      if (prof) setCurrentUser(prof);
    });

    navigate('/success');
    addToast('success', `Payment successful! Compartment ${currentOrder.lockerNumber || 'L-01'} is ready.`);
  };

  // Payment expired / stock released (handled via cron job & UI state)
  const handleOrderExpired = () => {
    if (currentOrder) {
      // Refresh products from backend DB where stock revert cron restored units
      fetchProductsAPI().then((p) => {
        if (p && p.length > 0) setProducts(p);
      });

      addToast('error', 'Payment timer expired. Locker & stock hold released.');
      navigate('/');
      setCurrentOrder(null);
    }
  };

  // Order cancellation
  const handleConfirmCancelOrder = () => {
    if (currentOrder) {
      fetchProductsAPI().then((p) => {
        if (p && p.length > 0) setProducts(p);
      });

      addToast('info', 'Order cancelled.');
      navigate('/');
      setCurrentOrder(null);
    }
  };

  // Claim order & unlock locker in DB
  const handleClaimPickup = async () => {
    if (!currentOrder) return;
    await claimPickupAPI(currentOrder.id);
    setCurrentOrder((prev) => (prev ? { ...prev, status: 'claimed' } : null));
    addToast('success', `Locker ${currentOrder.lockerNumber} unlocked. Pickup complete!`);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce(
    (sum, item) => sum + item.product.pricePaise * item.quantity,
    0
  );

  const wishlistedProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  // If visiting Admin Portal (/admin or /admin/*), render dedicated AdminLayout
  if (location.pathname.startsWith('/admin')) {
    return (
      <AdminLayout
        products={products}
        onUpdateProducts={setProducts}
        onGoToCustomerKiosk={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-stone-900 flex flex-col selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        currentUser={currentUser}
        onOpenCart={() => setIsCartModalOpen(true)}
        onOpenWishlist={() => setIsWishlistModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        onGoHome={() => navigate('/')}
        onGoToAdmin={() => navigate('/admin')}
      />

      {/* Main Container with React Router Routing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Routes>
          {/* Home / Catalog Screen */}
          <Route
            path="/"
            element={
              <div className="space-y-6">
                {/* Search & Filter Bar + Dynamic Active Categories from Database */}
                <CategoryTabs
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  products={products}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={handleOpenProductDetails}
                />

                {/* Hero Banner Auto-Carousel */}
                <HeroBanner
                  onOrderNow={() => {
                    const firstInStock = products.find((p) => p.stock > 0);
                    if (firstInStock) handleAddToCart(firstInStock);
                  }}
                />

                {/* Popular Combos / Products Section Header */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                      Popular Snacks & Combos
                    </h3>
                    <p className="text-xs text-stone-400 font-medium">
                      Instant smart locker self-pickup (Showing {homeProducts.length} items)
                    </p>
                  </div>

                  {/* View All Button leading to /view-all separate route */}
                  <button
                    onClick={() => navigate('/view-all')}
                    className="text-xs font-black text-primary hover:text-red-700 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>View All ({products.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* Product Grid: Top items on Home screen */}
                {isLoadingInitial ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-bold">Loading dispenser catalog...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
                    {homeProducts.map((product) => {
                      const cartItem = cart.find(
                        (item) => item.product.id === product.id
                      );
                      const isWishlisted = wishlistIds.includes(product.id);
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          quantityInCart={cartItem ? cartItem.quantity : 0}
                          isWishlisted={isWishlisted}
                          onAddToCart={handleAddToCart}
                          onUpdateQuantity={handleUpdateQuantity}
                          onToggleWishlist={handleToggleWishlist}
                          onSelectProduct={handleOpenProductDetails}
                        />
                      );
                    })}
                  </div>
                )}

                {!isLoadingInitial && filteredProducts.length === 0 && (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#EFE8DE] shadow-xs">
                    <p className="text-stone-500 font-medium">
                      No snacks found matching "{searchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="mt-3 px-4 py-2 text-xs font-bold text-primary bg-red-50 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            }
          />

          {/* Separate Dedicated Route for View All Screen */}
          <Route
            path="/view-all"
            element={
              <ViewAllScreen
                products={products}
                categories={categories}
                cart={cart}
                wishlistIds={wishlistIds}
                onBackToHome={() => navigate('/')}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onToggleWishlist={handleToggleWishlist}
                onSelectProduct={handleOpenProductDetails}
              />
            }
          />

          {/* Payment Screen Route */}
          <Route
            path="/payment"
            element={
              currentOrder ? (
                <PaymentScreen
                  order={currentOrder}
                  onCancelOrderClick={() => setIsConfirmCancelOpen(true)}
                  onSimulateSuccess={handlePaymentSuccess}
                  onSimulateExpire={handleOrderExpired}
                  onOrderExpired={handleOrderExpired}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Success Screen Route */}
          <Route
            path="/success"
            element={
              currentOrder ? (
                <SuccessScreen
                  order={currentOrder}
                  onViewDetails={() => setIsOrderDetailsOpen(true)}
                  onBackToHome={() => {
                    setCart([]);
                    setCurrentOrder(null);
                    navigate('/');
                  }}
                  onClaimOrder={handleClaimPickup}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer Section with Help Menu */}
      <Footer
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onGoHome={() => navigate('/')}
        onViewAll={() => navigate('/view-all')}
        onGoToAdmin={() => navigate('/admin')}
      />

      {/* Floating Bottom Bar in Primary RED theme (only on catalog and view-all) */}
      {(location.pathname === '/' || location.pathname === '/view-all') && totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-30 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
          <div
            onClick={() => setIsCartModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white p-3.5 sm:p-4 rounded-2xl shadow-floating flex items-center justify-between cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold text-red-100 block">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in cart
                </span>
                <span className="text-base font-black tracking-tight">
                  {formatRupees(totalCartAmount, true)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm bg-white text-primary px-4 py-2 rounded-xl shadow-xs">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProductForModal}
        isOpen={isProductDetailsOpen}
        quantityInCart={
          selectedProductForModal
            ? cart.find((item) => item.product.id === selectedProductForModal.id)?.quantity || 0
            : 0
        }
        isWishlisted={
          selectedProductForModal ? wishlistIds.includes(selectedProductForModal.id) : false
        }
        onClose={handleCloseProductDetails}
        onAddToCart={handleUpdateQuantityFromModal}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Customer Login & Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Customer Profile & Orders Modal */}
      {currentUser && (
        <CustomerProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          orders={currentOrder ? [currentOrder] : []}
          onLogout={handleLogout}
        />
      )}

      {/* Cart Modal Popup */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        isLoading={isPlacingOrder}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        wishlistedProducts={wishlistedProducts}
        onAddToCart={handleAddToCart}
        onRemoveFromWishlist={handleToggleWishlist}
      />

      {/* Modals & Dialogs */}
      <ConfirmCancelModal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={handleConfirmCancelOrder}
      />

      <StockErrorModal
        isOpen={isStockErrorOpen}
        message={stockErrorMessage}
        onClose={() => setIsStockErrorOpen(false)}
      />

      <OrderDetailsModal
        order={currentOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
