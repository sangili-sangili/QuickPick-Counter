import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/customer/Navbar';
import { HeroBanner } from './components/customer/HeroBanner';
import { CategoryTabs, Category } from './components/customer/CategoryTabs';
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
import { INITIAL_PRODUCTS } from './data/mockProducts';
import { Product, CartItem, Order, ToastMessage, CustomerUser } from './types';
import { formatRupees } from './utils/format';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { fetchProductsAPI, createOrderAPI, claimPickupAPI } from './services/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prod_1', 'prod_3']);
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Product Details Modal state
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);

  // Other modals state
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

  // Try fetching live products from backend on mount
  useEffect(() => {
    fetchProductsAPI().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods);
      }
    });
  }, []);

  // Filter products for home catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.subtitle &&
        prod.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.description &&
        prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Limit Home Page to max 8 products
  const homeProducts = filteredProducts.slice(0, 8);

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
  const handleLoginSuccess = (user: CustomerUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('snackhub_customer', JSON.stringify(user));
    } catch {}
    addToast('success', `Welcome, ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('snackhub_customer');
    } catch {}
    addToast('info', 'Signed out successfully.');
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    if (wishlistIds.includes(productId)) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      addToast('info', 'Removed from wishlist');
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      addToast('success', 'Added to wishlist');
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
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

    addToast('success', `${product.name} updated in cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
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
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order submission & stock hold
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const result = await createOrderAPI(orderPayload);
      const totalPaise = cart.reduce(
        (sum, item) => sum + item.product.pricePaise * item.quantity,
        0
      );

      const newOrder: Order = {
        id: result.orderId,
        orderNumber: result.orderNumber,
        items: [...cart],
        totalPaise,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        expiresInSeconds: result.expiresInSeconds || 120,
        expiresAt: Date.now() + (result.expiresInSeconds || 120) * 1000,
        lockerNumber: 'L-07',
      };

      // Temporarily hold stock
      setProducts((prev) =>
        prev.map((p) => {
          const inCart = cart.find((c) => c.product.id === p.id);
          if (inCart) {
            return { ...p, stock: Math.max(0, p.stock - inCart.quantity) };
          }
          return p;
        })
      );

      setCurrentOrder(newOrder);
      setIsCartModalOpen(false);
      navigate('/payment');

      // Trigger toasts
      addToast('success', 'Order placed successfully!');
      setTimeout(() => {
        addToast('info', 'Waiting for payment...');
      }, 700);
    } catch (err) {
      addToast('error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Payment simulated success
  const handlePaymentSuccess = () => {
    if (!currentOrder) return;

    setCurrentOrder((prev) => (prev ? { ...prev, status: 'paid' } : null));
    navigate('/success');
    addToast('success', 'Payment successful! Locker L-07 is ready.');
  };

  // Payment expired / stock released
  const handleOrderExpired = () => {
    if (currentOrder) {
      // Release held stock
      setProducts((prev) =>
        prev.map((p) => {
          const heldItem = currentOrder.items.find(
            (item) => item.product.id === p.id
          );
          if (heldItem) {
            return { ...p, stock: p.stock + heldItem.quantity };
          }
          return p;
        })
      );

      addToast('error', 'Order expired. Held stock has been released.');
      navigate('/');
      setCurrentOrder(null);
    }
  };

  // Order cancellation
  const handleConfirmCancelOrder = () => {
    if (currentOrder) {
      // Release held stock
      setProducts((prev) =>
        prev.map((p) => {
          const heldItem = currentOrder.items.find(
            (item) => item.product.id === p.id
          );
          if (heldItem) {
            return { ...p, stock: p.stock + heldItem.quantity };
          }
          return p;
        })
      );

      addToast('info', 'Order cancelled. Held stock has been released.');
      navigate('/');
      setCurrentOrder(null);
    }
  };

  // Claim order & unlock locker
  const handleClaimPickup = async () => {
    if (!currentOrder) return;
    await claimPickupAPI(currentOrder.id);
    setCurrentOrder((prev) => (prev ? { ...prev, status: 'claimed' } : null));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce(
    (sum, item) => sum + item.product.pricePaise * item.quantity,
    0
  );

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

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
                {/* Search & Filter Bar + Categories */}
                <CategoryTabs
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
                      Instant smart locker self-pickup (Showing top {homeProducts.length} items)
                    </p>
                  </div>

                  {/* View All Button leading to /view-all separate route */}
                  <button
                    onClick={() => navigate('/view-all')}
                    className="text-xs font-black text-primary hover:text-red-700 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* Product Grid: Top 8 items on Home screen */}
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

                {filteredProducts.length === 0 && (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#EFE8DE] shadow-sm">
                    <p className="text-stone-500 font-medium">
                      No snacks found matching "{searchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="mt-3 px-4 py-2 text-xs font-bold text-primary bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
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

      {/* Product Details Modal (Requirement 1: popup showing full product details on card click) */}
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

      {/* Customer Login & Register Modal (Requirement 3) */}
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
