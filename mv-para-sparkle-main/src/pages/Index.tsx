import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/contexts/ProductContext";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid2x2,
  List,
  Lock,
  MapPin,
  Search,
  ShoppingBag,
  Star,
  User,
  Smartphone,
  Truck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import svrBanner from "@/assets/svr.jpg";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Promesses from "@/components/site/Promesses";
import Categories from "@/components/site/Categories";
import CategoryShowcase from "@/components/site/CategoryShowcase";
import Produits from "@/components/site/Produits";
import Editorial from "@/components/site/Editorial";
import Marques from "@/components/site/Marques";
import Newsletter from "@/components/site/Newsletter";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CartLine,
  clearStoredWebCustomerSession,
  createProductReview,
  createWebOrder,
  fetchCompanySettings,
  fetchProductReviews,
  fetchWebCategories,
  findCategoryBySlug,
  formatMoney,
  getProductBrand,
  getProductCategory,
  getProductGalleryImages,
  getProductImage,
  getProductOldPrice,
  getProductPromoBadge,
  getProductSpecs,
  getProductWebPrice,
  loadWebCustomerSession,
  normalizeText,
  Product,
  ProductReview,
  saveWebCustomerProfile,
  signInWebCustomer,
  signOutWebCustomer,
  signUpWebCustomer,
  trackWebOrder,
  WebCategory,
  WebCustomerSession,
  WebOrder,
} from "@/lib/store-api";

// ---------------------------------------------------------------------------
// Query key constants (données NON-produits uniquement)
// ---------------------------------------------------------------------------
const QK = {
  categories: ["web-categories"] as const,
  companySettings: ["company-settings"] as const,
  productReviews: (id: string) => ["product-reviews", id] as const,
} as const;

const Index = () => {
  const navigate = useNavigate();
  const params = useParams();
  const categorySlug = params.code ? null : params.slug || null;
  const productCode = params.code || null;
  const isCategoryPage = Boolean(categorySlug);
  const isProductPage = Boolean(productCode);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAccessGranted, setCheckoutAccessGranted] = useState(false);
  const [, setActiveCheckoutSection] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authSubmitSource, setAuthSubmitSource] = useState<"account" | "checkout">("account");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [customerSession, setCustomerSession] = useState<WebCustomerSession | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authAddress, setAuthAddress] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [paymentMode, setPaymentMode] = useState("Paiement a la livraison");
  const [deliveryMode, setDeliveryMode] = useState("Livraison standard");
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState("");
  const [trackingPhone, setTrackingPhone] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [selectedLeafSlug, setSelectedLeafSlug] = useState<string>("all");
  const [sortOption, setSortOption] = useState("default");
  const [perPage, setPerPage] = useState("12");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Produits : store global (1 seul fetch, zéro egress après le 1er chargement) ---
  const {
    allProducts,
    isLoading: productsGlobalLoading,
    getProductByCode,
    getBrands,
    getHomeProducts,
    getCategoryProducts,
    getSimilarProducts,
  } = useProducts();

  // Home page
  const homeProducts = useMemo(() => getHomeProducts(), [getHomeProducts]);
  const homeLoading = productsGlobalLoading;

  // Category page : filtrage + tri + pagination côté client
  const unfilteredCategoryProducts = useMemo(
    () => (categorySlug ? getCategoryProducts(categorySlug) : []),
    [categorySlug, getCategoryProducts]
  );
  const categoryLoading = productsGlobalLoading;

  const filteredProducts = useMemo(() => {
    let result = unfilteredCategoryProducts;

    if (selectedLeafSlug !== "all") {
      result = result.filter((p) => p.web_category_slug === selectedLeafSlug);
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(String(p.product_brand || "")));
    }
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "lt50") result = result.filter((p) => (p.prix_vente_ttc || 0) < 50);
      else if (selectedPriceRange === "50to100") result = result.filter((p) => (p.prix_vente_ttc || 0) >= 50 && (p.prix_vente_ttc || 0) <= 100);
      else if (selectedPriceRange === "gt100") result = result.filter((p) => (p.prix_vente_ttc || 0) > 100);
    }

    if (sortOption === "price-asc") result.sort((a, b) => (a.prix_vente_ttc || 0) - (b.prix_vente_ttc || 0));
    else if (sortOption === "price-desc") result.sort((a, b) => (b.prix_vente_ttc || 0) - (a.prix_vente_ttc || 0));
    else if (sortOption === "name-asc") result.sort((a, b) => a.designation.localeCompare(b.designation, "fr"));

    return result;
  }, [unfilteredCategoryProducts, selectedLeafSlug, selectedBrands, selectedPriceRange, sortOption]);

  const totalCategoryProducts = filteredProducts.length;
  const perPageNum = Number(perPage);
  const totalCategoryPages = Math.max(1, Math.ceil(totalCategoryProducts / perPageNum));
  const categoryProducts = filteredProducts.slice(
    (currentPage - 1) * perPageNum,
    currentPage * perPageNum
  );

  // Product detail : lecture dans le store global
  const selectedProduct = useMemo(
    () => (productCode ? getProductByCode(productCode) : null),
    [productCode, getProductByCode]
  );
  const productLoading = productsGlobalLoading && Boolean(productCode);

  // Categories tree
  const { data: categoryTree = [] } = useQuery({
    queryKey: QK.categories,
    queryFn: fetchWebCategories,
  });

  // Company settings
  const { data: companySettings = null } = useQuery({
    queryKey: QK.companySettings,
    queryFn: fetchCompanySettings,
  });

  // Marques : depuis le store local
  const availableBrands = useMemo(
    () => (categorySlug ? getBrands(categorySlug) : []),
    [categorySlug, getBrands]
  );

  // Produits similaires : depuis le store local
  const similarProducts = useMemo(
    () => (selectedProduct ? getSimilarProducts(selectedProduct, 4) : []),
    [selectedProduct, getSimilarProducts]
  );

  function getDeliveryFeeByMode(mode: string) {
    const normalizedMode = mode.trim().toLowerCase();
    if (normalizedMode.includes("express")) return Number(companySettings?.deliveryFeeExpress || 0);
    if (normalizedMode.includes("retrait")) return Number(companySettings?.deliveryFeePickup || 0);
    return Number(companySettings?.deliveryFeeStandard || 0);
  }

  useEffect(() => {
    let active = true;
    loadWebCustomerSession().then((session) => {
      if (!active) return;
      setCustomerSession(session);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!customerSession) return;
    const profile = customerSession.profile;
    const fullName = String(profile?.full_name || "").trim();
    const email = String(profile?.email || "").trim();
    const phone = String(profile?.phone || customerSession.user.phone || "").trim();
    const address = String(profile?.address || "").trim();
    setCustomerName((current) => current || fullName || phone);
    setCustomerPhone((current) => current || phone);
    setCustomerAddress((current) => current || address);
    setAuthName(fullName || phone);
    setAuthEmail(email);
    setAuthPhone(phone);
    setAuthAddress(address);
    setAuthPassword("");
  }, [customerSession]);

  useEffect(() => {
    if (!checkoutOpen) return;
    if (customerSession?.access_token) {
      setCheckoutAccessGranted(true);
      setActiveCheckoutSection(2);
      return;
    }
    setCheckoutAccessGranted(false);
    setActiveCheckoutSection(1);
  }, [checkoutOpen, customerSession]);

  useEffect(() => {
    if (productCode) return;
    setActiveCategory(categorySlug || "all");
    setSelectedBrands([]);
    setSelectedPriceRange("all");
    setSelectedAvailability("all");
    setSelectedLeafSlug("all");
    setSortOption("default");
    setPerPage("12");
    setCurrentPage(1);
  }, [categorySlug, productCode]);

  const selectedNode = useMemo(
    () => findCategoryBySlug(categoryTree, activeCategory),
    [categoryTree, activeCategory]
  );

  const descendantLeafCategories = useMemo(() => {
    if (!selectedNode) return [];
    return collectLeafNodes(selectedNode).filter((node) => node.slug !== selectedNode.slug);
  }, [selectedNode]);

  // Product category path (for breadcrumb)
  const productCategoryPath = useMemo(
    () =>
      selectedProduct?.web_category_slug
        ? findCategoryPath(categoryTree, selectedProduct.web_category_slug)
        : [],
    [categoryTree, selectedProduct]
  );

  // Search : recherche locale dans le store global (0 egress)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const searchSuggestions = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (term.length < 2) return [];
    return allProducts
      .filter((p) =>
        p.designation.toLowerCase().includes(term) ||
        String(p.code_article || "").toLowerCase().includes(term) ||
        String(p.product_brand || "").toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [allProducts, debouncedSearch]);

  // Wrap query setter to also update searchTerm
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSearchTerm(value);
  }, []);

  const categoryPath = useMemo(
    () => findCategoryPath(categoryTree, activeCategory),
    [categoryTree, activeCategory]
  );

  // --- Auth mutation ---
  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === "register") {
        return signUpWebCustomer({
          fullName: authName,
          email: authEmail,
          phone: authPhone,
          password: authPassword,
          address: authAddress,
        });
      }
      return signInWebCustomer({ phone: authPhone, password: authPassword });
    },
    onSuccess: (session) => {
      setCustomerSession(session);
      setAuthPassword("");
      if (authSubmitSource === "account") setAuthOpen(false);
      if (authSubmitSource === "checkout") {
        setCheckoutAccessGranted(true);
        setActiveCheckoutSection(2);
      }
      toast.success(authMode === "register" ? "Compte client cree avec succes" : "Connexion reussie", {
        description: session.profile?.full_name || session.user.phone,
      });
    },
    onError: (error) => {
      toast.error(authMode === "register" ? "Inscription impossible" : "Connexion impossible", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    },
  });

  // --- Order mutation ---
  const orderMutation = useMutation({
    mutationFn: async () => {
      if (customerSession?.access_token && customerSession.user?.id) {
        const profile = await saveWebCustomerProfile(customerSession.access_token, {
          id: customerSession.user.id,
          email: authEmail,
          full_name: customerName,
          phone: customerPhone,
          address: customerAddress,
        });
        setCustomerSession((current) => current ? { ...current, profile } : current);
      }
      return createWebOrder({
        customerName,
        customerPhone,
        customerAddress,
        notes,
        paymentMode,
        deliveryMode,
        deliveryFeeTtc: checkoutDeliveryFee,
        cart,
      });
    },
    onSuccess: ({ orderNumber, order }) => {
      const deliveryFee = Number(order?.delivery_fee_ttc || 0);
      const totalTtc = Number(order?.total_ttc || 0);
      toast.success("Commande envoyee avec succes", {
        description: `Numero ${orderNumber} | Frais livraison ${formatMoney(deliveryFee)} | Total ${formatMoney(totalTtc)}`,
      });
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      if (customerSession?.profile) {
        setCustomerName(customerSession.profile.full_name || customerSession.user.phone);
        setCustomerPhone(customerSession.profile.phone || "");
        setCustomerAddress(customerSession.profile.address || "");
      } else {
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
      }
      setNotes("");
      setPaymentMode("Paiement a la livraison");
      setDeliveryMode("Livraison standard");
    },
    onError: (error) => {
      toast.error("Impossible d'envoyer la commande", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: async () => {
      if (!trackingOrderNumber.trim() || !trackingPhone.trim()) {
        throw new Error("Numero de commande et telephone sont obligatoires.");
      }
      return trackWebOrder(trackingOrderNumber, trackingPhone);
    },
  });

  function handleCategorySelection(category: string) {
    setActiveCategory(category);
    navigate(category === "all" ? "/" : `/categorie/${category}`);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        const targetId = category === "all" ? "catalogue" : "category-page";
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function openProduct(product: Product) {
    navigate(getProductHref(product));
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }

  function openAccountDialog() {
    setAuthMode("login");
    setAuthPassword("");
    setAuthSubmitSource("account");
    setAuthOpen(true);
  }

  async function handleLogout() {
    await signOutWebCustomer(customerSession);
    clearStoredWebCustomerSession();
    setCustomerSession(null);
    setAuthPassword("");
    toast.success("Deconnexion effectuee.");
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    toast.success("Produit ajoute au panier");
  }

  function buyNow(product: Product) {
    addToCart(product);
    setCartOpen(true);
  }

  function changeCartQuantity(productId: string, nextQuantity: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: Math.max(1, nextQuantity) } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.product.id !== productId));
  }

  function clearCategoryFilters() {
    setSelectedBrands([]);
    setSelectedPriceRange("all");
    setSelectedAvailability("all");
    setSelectedLeafSlug("all");
    setSortOption("default");
    setPerPage("12");
    setCurrentPage(1);
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]
    );
    setCurrentPage(1);
  }

  function submitOrder() {
    if (!customerSession?.access_token) {
      setActiveCheckoutSection(1);
      setCheckoutAccessGranted(false);
      toast.error("Veuillez creer un compte ou vous connecter avant la validation finale.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Nom et telephone sont obligatoires");
      return;
    }
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }
    orderMutation.mutate();
  }

  function submitCustomerAuth() {
    if (!authPhone.trim() || !authPassword.trim()) {
      toast.error("Numero de telephone et mot de passe sont obligatoires.");
      return;
    }
    if (authPassword.trim().length < 4) {
      toast.error("Le mot de passe doit contenir au moins 4 caracteres.");
      return;
    }
    if (authMode === "register" && (!authName.trim() || !authPhone.trim() || !authAddress.trim())) {
      toast.error("Nom complet, telephone et adresse sont obligatoires.");
      return;
    }
    authMutation.mutate();
  }

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + getProductWebPrice(line.product) * line.quantity, 0);
  const checkoutDeliveryFee = getDeliveryFeeByMode(deliveryMode);
  const checkoutGrandTotal = cartTotal + checkoutDeliveryFee;
  const customerAccountLabel = useMemo(() => {
    const fullName = String(customerSession?.profile?.full_name || "").trim();
    if (fullName) return fullName;
    return String(customerSession?.user.phone || "").trim();
  }, [customerSession]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        query={query}
        onQueryChange={handleQueryChange}
        searchSuggestions={searchSuggestions}
        onSelectSearchProduct={(product) => {
          setQuery(product.designation || "");
          openProduct(product);
        }}
        isAuthenticated={Boolean(customerSession?.access_token)}
        accountLabel={customerAccountLabel}
        onOpenAccount={openAccountDialog}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenTracking={() => setTrackingOpen(true)}
        onSelectCategory={handleCategorySelection}
        categoryTree={categoryTree}
        activeCategory={isProductPage ? productCategoryPath[0]?.slug || "all" : activeCategory}
        companySettings={companySettings}
      />

      <main>
        {isProductPage ? (
          <ProductShowcasePage
            product={selectedProduct || null}
            loading={productLoading}
            breadcrumb={productCategoryPath}
            similarProducts={similarProducts}
            onAddToCart={addToCart}
            onBuyNow={buyNow}
            onOpenProduct={openProduct}
          />
        ) : isCategoryPage ? (
          <CategoryCatalogPage
            title={categoryPath.length ? categoryPath[categoryPath.length - 1].name : getPrettySlug(activeCategory)}
            breadcrumb={categoryPath.map((item) => item.name)}
            products={categoryProducts}
            totalProducts={totalCategoryProducts}
            loading={categoryLoading}
            brands={availableBrands}
            selectedBrands={selectedBrands}
            selectedPriceRange={selectedPriceRange}
            selectedAvailability={selectedAvailability}
            onToggleBrand={toggleBrand}
            onSelectPriceRange={(value) => {
              setSelectedPriceRange(value);
              setCurrentPage(1);
            }}
            onSelectAvailability={(value) => {
              setSelectedAvailability(value);
              setCurrentPage(1);
            }}
            leafCategories={descendantLeafCategories}
            selectedLeafSlug={selectedLeafSlug}
            onSelectLeafSlug={(value) => {
              setSelectedLeafSlug(value);
              setCurrentPage(1);
            }}
            onClearFilters={clearCategoryFilters}
            sortOption={sortOption}
            onSortChange={(value) => {
              setSortOption(value);
              setCurrentPage(1);
            }}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalCategoryPages}
            onPageChange={setCurrentPage}
            onAddToCart={addToCart}
            onOpenProduct={openProduct}
          />
        ) : (
          <>
            <Hero
              productsCount={homeProducts.length}
              categoriesCount={categoryTree.length}
              inStockCount={homeProducts.filter((item) => Number(item.stock_actuel || 0) > 0).length}
            />
            <Promesses />
            <Categories
              categories={categoryTree}
              activeCategory={activeCategory}
              onSelectCategory={handleCategorySelection}
              productCount={homeProducts.length}
            />
            <CategoryShowcase
              categories={categoryTree}
              products={homeProducts}
              onAddToCart={addToCart}
              onOpenProduct={openProduct}
              onSelectCategory={handleCategorySelection}
            />
            <Produits
              products={homeProducts.filter((p) => !!String(p.image_url || "").trim()).slice(0, 20)}
              loading={homeLoading}
              onAddToCart={addToCart}
              onOpenProduct={openProduct}
            />
            <section className="bg-white py-6 lg:py-8">
              <div className="container">
                <div className="overflow-hidden rounded-[0.5rem] border border-[#ebe3d9] bg-[#fffdfa] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <img src={svrBanner} alt="SVR" className="h-auto w-full object-cover" />
                </div>
              </div>
            </section>
            <Editorial />
            <Marques />
            <Newsletter />
          </>
        )}
      </main>

      <Footer companySettings={companySettings} />

      <Button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-12 rounded-full gradient-primary px-4 text-sm shadow-elegant sm:bottom-6 sm:right-6 sm:h-14 sm:px-5"
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        Panier ({cartCount})
      </Button>

      {/* ---- Auth Dialog ---- */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[1.1rem] border border-[#e8e3db] p-4 sm:rounded-[1.4rem] sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-[2rem] text-primary">
              {customerSession ? "Mon compte client" : "Authentification Rapide"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667684]">
              {customerSession
                ? "Retrouvez vos informations et restez reconnu sur le site."
                : "Connectez-vous avec votre numero de telephone et votre mot de passe, ou creez votre compte rapidement."}
            </DialogDescription>
          </DialogHeader>

          {customerSession ? (
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-[#dbe9e1] bg-[#f4fbf7] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-[#15796e]">Compte actif</div>
                <div className="mt-3 text-2xl font-semibold text-[#22303a]">
                  {customerSession.profile?.full_name || customerSession.user.phone}
                </div>
                <div className="mt-2 text-sm text-[#5c6c79]">Authentification Rapide - {customerSession.user.phone}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoBox label="Telephone" value={customerSession.profile?.phone || customerPhone || "-"} />
                  <InfoBox label="Email" value={customerSession.profile?.email || authEmail || "-"} />
                  <InfoBox label="Adresse" value={customerSession.profile?.address || customerAddress || "-"} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-full" onClick={() => setAuthOpen(false)}>Fermer</Button>
                <Button variant="outline" className="rounded-full" onClick={() => void handleLogout()}>Deconnexion</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[1rem] border border-[#e7e2d9] bg-[#fcfbf8] px-4 py-3 text-sm leading-6 text-[#5f6f7a]">
                Le numero de telephone sert d'identifiant de connexion.
              </div>
              <div className="inline-flex rounded-[0.9rem] border border-[#e7e2d9] bg-[#f8f5f0] p-1">
                <button type="button" onClick={() => setAuthMode("login")} className={`rounded-[0.7rem] px-4 py-2 text-sm font-semibold transition-colors ${authMode === "login" ? "bg-white text-[#22303a] shadow-sm" : "text-[#7d6f62]"}`}>Connexion</button>
                <button type="button" onClick={() => setAuthMode("register")} className={`rounded-[0.7rem] px-4 py-2 text-sm font-semibold transition-colors ${authMode === "register" ? "bg-white text-[#22303a] shadow-sm" : "text-[#7d6f62]"}`}>Inscription</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {authMode === "register" ? (
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7f8f]">Nom complet</span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11b17c]" />
                      <Input placeholder="Nom complet" value={authName} onChange={(event) => setAuthName(event.target.value)} className="h-12 rounded-[0.9rem] border-[#d8e2de] pl-11" />
                    </div>
                  </label>
                ) : null}
                {authMode === "register" ? (
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7f8f]">Email facultatif</span>
                    <Input placeholder="Email facultatif" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="h-12 rounded-[0.9rem] border-[#d8e2de]" />
                  </label>
                ) : null}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7f8f]">Numero de telephone</span>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11b17c]" />
                    <Input placeholder="Numero de telephone" inputMode="tel" value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} className="h-12 rounded-[0.9rem] border-[#d8e2de] pl-11" />
                  </div>
                </label>
                {authMode === "register" ? (
                  <div className="rounded-[0.9rem] border border-[#ebe5dc] bg-[#f9f7f2] px-4 py-3 text-sm leading-6 text-[#667684]">
                    Votre numero de telephone sera utilise comme identifiant de connexion.
                  </div>
                ) : null}
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7f8f]">Mot de passe</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11b17c]" />
                    <Input placeholder="Mot de passe" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} className="h-12 rounded-[0.9rem] border-[#d8e2de] pl-11" />
                  </div>
                </label>
              </div>
              {authMode === "register" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7f8f]">Adresse</span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-[#11b17c]" />
                    <Textarea placeholder="Adresse" value={authAddress} onChange={(event) => setAuthAddress(event.target.value)} className="min-h-24 rounded-[0.9rem] border-[#d8e2de] pl-11" />
                  </div>
                </label>
              ) : null}
              <div className="flex flex-col gap-3 border-t border-[#ece7de] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[#6f7d87]">
                  {authMode === "register" ? "Votre compte sera cree en quelques secondes." : "Utilisez le numero deja enregistre."}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-[0.9rem]" onClick={() => setAuthOpen(false)}>Fermer</Button>
                  <Button className="rounded-[0.9rem] bg-[#11b17c] text-white hover:bg-[#0f9b6d] sm:min-w-[180px]" onClick={submitCustomerAuth} disabled={authMutation.isPending}>
                    {authMutation.isPending ? "Traitement..." : authMode === "register" ? "Creer mon compte" : "Se connecter"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Cart Dialog ---- */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto rounded-[1.4rem] p-4 sm:rounded-[2rem] sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-primary">Votre panier</DialogTitle>
            <DialogDescription>Verifiez vos produits avant de finaliser votre commande.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[52vh] space-y-4 overflow-auto pr-2">
            {cart.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucun produit dans le panier.</div>
            ) : (
              cart.map((line) => (
                <div key={line.product.id} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-accent-deep">{getProductCategory(line.product)}</p>
                    <h3 className="mt-1 text-lg font-medium text-foreground">{line.product.designation}</h3>
                    <p className="text-sm text-muted-foreground">{line.product.code_article} - {formatMoney(line.product.prix_vente_ttc || 0)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="number" min={1} value={line.quantity} onChange={(event) => changeCartQuantity(line.product.id, Number(event.target.value || 1))} className="w-20 rounded-full text-center" />
                    <div className="min-w-[110px] text-right font-sans text-[1.35rem] font-semibold tabular-nums tracking-tight text-primary">{formatMoney((line.product.prix_vente_ttc || 0) * line.quantity)}</div>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => removeFromCart(line.product.id)}>Retirer</Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Total</p>
              <p className="font-sans text-[2.6rem] font-semibold tabular-nums tracking-tight text-primary">{formatMoney(cartTotal)}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="rounded-full" onClick={() => setCartOpen(false)}>Continuer</Button>
              <Button className="rounded-full gradient-primary" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} disabled={cart.length === 0}>Finaliser la commande</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Checkout Dialog ---- */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-0.75rem)] max-w-[56rem] overflow-y-auto rounded-[1rem] p-3 sm:w-[calc(100vw-1rem)] sm:rounded-[1.35rem] sm:p-3.5 lg:p-4">
          <DialogHeader>
            <DialogTitle className="font-display text-[1.75rem] text-[#c61e2d] sm:text-[2.35rem]">Validation de commande</DialogTitle>
            <DialogDescription className="text-sm leading-5 sm:text-[0.96rem]">Finalisez votre commande par etapes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <section className="border-b border-[#ebe5db] pb-3">
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#ff4a77] sm:text-[0.84rem]">Etape 1: Options de la commande</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="flex h-full flex-col gap-3">
                  <div><h3 className="text-[1.45rem] font-medium text-[#c61e2d] sm:text-[1.7rem]">Authentification rapide</h3><div className="mt-2 h-px w-12 bg-[#ff9cb6]" /></div>
                  <label className="flex items-start gap-3"><input type="radio" checked readOnly className="mt-1" /><span className="text-base font-medium text-[#22303a]">Creer mon compte</span></label>
                  <p className="max-w-xl text-[0.88rem] leading-5 text-[#4f6272] sm:text-[0.92rem] sm:leading-6">Creez votre compte avec nom complet, numero de telephone, adresse et mot de passe.</p>
                  <Button type="button" className="mt-auto h-9.5 w-full rounded-[0.3rem] bg-[#11b17c] px-3 text-[0.74rem] font-semibold uppercase tracking-[0.04em] text-white hover:bg-[#0f9b6d] sm:h-10 sm:text-[0.8rem] sm:tracking-[0.05em]" onClick={() => { setAuthMode("register"); setAuthSubmitSource("checkout"); setAuthPassword(""); setAuthOpen(true); }}>Creer mon compte</Button>
                </div>
                <div className="flex h-full flex-col gap-3">
                  <div><h3 className="text-[1.45rem] font-medium text-[#c61e2d] sm:text-[1.7rem]">Connexion rapide</h3><div className="mt-2 h-px w-12 bg-[#ff9cb6]" /></div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-1.5 md:col-span-1">
                      <label className="text-[0.84rem] font-semibold text-[#22303a]">Numero tel</label>
                      <Input placeholder="Numero de telephone" inputMode="tel" value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} className="h-10 rounded-[0.3rem] border-[#cdb8a1] focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" />
                    </div>
                    <div className="grid gap-1.5 md:col-span-1">
                      <label className="text-[0.84rem] font-semibold text-[#22303a]">Mot de passe</label>
                      <Input placeholder="Mot de passe" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} className="h-10 rounded-[0.3rem] border-[#cdb8a1] focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" />
                    </div>
                  </div>
                  <Button type="button" className="mt-auto h-9.5 w-full rounded-[0.3rem] bg-[#11b17c] px-3 text-[0.74rem] font-semibold uppercase tracking-[0.04em] text-white hover:bg-[#0f9b6d] sm:h-10 sm:text-[0.8rem] sm:tracking-[0.05em]" onClick={() => { setAuthMode("login"); setAuthSubmitSource("checkout"); submitCustomerAuth(); }} disabled={authMutation.isPending}>
                    {authMutation.isPending ? "Traitement..." : "Se connecter"}
                  </Button>
                </div>
              </div>
            </section>
            <CheckoutSection step={2} title="Compte et details de facturation" disabled={!checkoutAccessGranted}>
              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="grid gap-1.5"><label className="text-[0.84rem] font-semibold text-[#22303a]">Nom et Prenom</label><Input placeholder="Nom complet" value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="h-10 rounded-[0.3rem] border-[#cdb8a1] focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" /></div>
                <div className="grid gap-1.5"><label className="text-[0.84rem] font-semibold text-[#22303a]">Numero tel</label><Input placeholder="Telephone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="h-10 rounded-[0.3rem] border-[#cdb8a1] focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" /></div>
              </div>
            </CheckoutSection>
            <CheckoutSection step={3} title="Details de livraison" disabled={!checkoutAccessGranted}>
              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="grid gap-1.5"><label className="text-[0.84rem] font-semibold text-[#22303a]">Adresse de livraison</label><Textarea placeholder="Adresse de livraison" value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} className="min-h-[7.25rem] rounded-[0.3rem] border-[#cdb8a1] px-3 py-2.5 focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" /></div>
                <div className="grid gap-1.5"><label className="text-[0.84rem] font-semibold text-[#22303a]">Note complementaire</label><Textarea placeholder="Note complementaire" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-[7.25rem] rounded-[0.3rem] border-[#cdb8a1] px-3 py-2.5 focus-visible:border-[#b48a64] focus-visible:ring-[#b48a64]/25" /></div>
              </div>
            </CheckoutSection>
            <div className="grid gap-2.5 md:grid-cols-2">
              <CheckoutSection step={4} title="Mode de livraison" disabled={!checkoutAccessGranted}>
                <div className="grid gap-1.5">
                  <label className="text-[0.84rem] font-semibold text-[#22303a]">Mode de livraison</label>
                  <select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value)} className="h-10 w-full rounded-[0.3rem] border border-[#cdb8a1] bg-background px-3 text-sm outline-none focus:border-[#b48a64] focus:ring-2 focus:ring-[#b48a64]/25">
                    <option>Livraison standard</option><option>Retrait en magasin</option><option>Livraison express</option>
                  </select>
                </div>
              </CheckoutSection>
              <CheckoutSection step={5} title="Moyen de paiement" disabled={!checkoutAccessGranted}>
                <div className="grid gap-1.5">
                  <label className="text-[0.84rem] font-semibold text-[#22303a]">Moyen de paiement</label>
                  <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} className="h-10 w-full rounded-[0.3rem] border border-[#cdb8a1] bg-background px-3 text-sm outline-none focus:border-[#b48a64] focus:ring-2 focus:ring-[#b48a64]/25">
                    <option>Paiement a la livraison</option><option>Paiement a l'enlevement</option><option>Virement / reglement differe</option>
                  </select>
                </div>
              </CheckoutSection>
            </div>
            <CheckoutSection step={6} title="Confirmer la commande" disabled={!checkoutAccessGranted}>
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[1.08fr_0.92fr] lg:gap-3">
                <div className="rounded-[1rem] border border-[#e8e0d7] bg-[#fffdfa] p-3.5">
                  <h3 className="font-display text-lg text-primary sm:text-xl">Resume</h3>
                  <div className="mt-3 space-y-2">
                    {cart.map((line) => (
                      <div key={line.product.id} className="flex flex-wrap justify-between gap-2 text-[0.9rem]">
                        <span className="text-muted-foreground">{line.product.designation} x{line.quantity}</span>
                        <strong className="font-sans text-[1rem] font-semibold tabular-nums tracking-tight text-foreground">{formatMoney((line.product.prix_vente_ttc || 0) * line.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-border pt-2.5">
                    <div className="flex w-full justify-between gap-3 text-[0.9rem] text-muted-foreground"><span>Frais livraison</span><strong className="font-sans text-[1.05rem] font-semibold tabular-nums tracking-tight text-foreground">{formatMoney(checkoutDeliveryFee)}</strong></div>
                    <span className="text-[0.82rem] uppercase tracking-[0.18em] text-muted-foreground">Total TTC</span>
                    <strong className="font-sans text-[1.85rem] font-semibold tabular-nums tracking-tight text-primary sm:text-[2.25rem]">{formatMoney(checkoutGrandTotal)}</strong>
                  </div>
                  <div className="mt-2.5 space-y-1 text-[0.86rem] text-muted-foreground">
                    <div className="flex justify-between gap-3"><span>Livraison</span><strong className="text-foreground">{deliveryMode}</strong></div>
                    <div className="flex justify-between gap-3"><span>Paiement</span><strong className="text-foreground">{paymentMode}</strong></div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <Button className="h-10 w-full rounded-[0.3rem] bg-[#11b17c] text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-white hover:bg-[#0f9d6b] sm:text-[0.84rem]" onClick={submitOrder} disabled={orderMutation.isPending || cart.length === 0 || !checkoutAccessGranted}>
                    {orderMutation.isPending ? "Envoi en cours..." : "Envoyer la commande"}
                  </Button>
                </div>
              </div>
            </CheckoutSection>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- Tracking Dialog ---- */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-0.75rem)] max-w-2xl overflow-y-auto rounded-[1.15rem] p-3 sm:w-[calc(100vw-1rem)] sm:rounded-[2rem] sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-[2rem] text-primary sm:text-3xl">Suivi de commande</DialogTitle>
            <DialogDescription>Entrez le numero de commande et le telephone utilise a la validation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Ex: WEB-20260430-120010" value={trackingOrderNumber} onChange={(event) => setTrackingOrderNumber(event.target.value)} className="h-12 rounded-2xl" />
            <Input placeholder="Telephone" value={trackingPhone} onChange={(event) => setTrackingPhone(event.target.value)} className="h-12 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Button className="w-full rounded-full gradient-primary sm:w-auto" onClick={() => trackingMutation.mutate()} disabled={trackingMutation.isPending}>
              {trackingMutation.isPending ? "Recherche..." : "Suivre ma commande"}
            </Button>
          </div>
          {trackingMutation.isError ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">{trackingMutation.error instanceof Error ? trackingMutation.error.message : "Erreur de suivi"}</div>
          ) : null}
          {trackingMutation.isSuccess ? (
            trackingMutation.data ? (
              <TrackingCard order={trackingMutation.data} />
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucune commande trouvee avec ces informations.</div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components (unchanged from original — kept for completeness)
// ---------------------------------------------------------------------------

function CheckoutSection({ step, title, disabled, children }: { step: number; title: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section className={`border-b border-[#ebe5db] pb-4 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex w-full items-center justify-between text-left">
        <p className="pr-3 text-[0.76rem] font-semibold uppercase tracking-[0.05em] text-[#c61e2d] sm:text-[0.84rem] sm:tracking-[0.08em]">Etape {step}: {title}</p>
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function ProductShowcasePage({ product, loading, breadcrumb, similarProducts, onAddToCart, onBuyNow, onOpenProduct }: {
  product: Product | null; loading: boolean; breadcrumb: WebCategory[]; similarProducts: Product[];
  onAddToCart: (product: Product) => void; onBuyNow: (product: Product) => void; onOpenProduct: (product: Product) => void;
}) {
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "specs">("description");
  const [reviewName, setReviewName] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => { setActiveImage(0); setActiveTab("description"); }, [product?.id]);

  const { data: reviews = [] } = useQuery({
    queryKey: QK.productReviews(product?.id || ""),
    queryFn: () => fetchProductReviews(product!.id),
    enabled: Boolean(product?.id),
  });

  const reviewMutation = useMutation({
    mutationFn: () => createProductReview({ productId: product!.id, customerName: reviewName.trim(), rating: reviewRating, reviewTitle: reviewTitle.trim(), comment: reviewComment.trim() }),
    onSuccess: async () => { setReviewName(""); setReviewTitle(""); setReviewComment(""); setReviewRating(5); await queryClient.invalidateQueries({ queryKey: QK.productReviews(product?.id || "") }); toast.success("Votre avis a bien ete enregistre."); },
    onError: (error) => { toast.error("Impossible d'enregistrer l'avis.", { description: error instanceof Error ? error.message : "Erreur inconnue" }); },
  });

  if (loading) return <section className="bg-white py-12 lg:py-16"><div className="container"><div className="grid gap-5 xl:grid-cols-[0.96fr_1.04fr] xl:gap-8"><div className="h-[360px] rounded-[1.4rem] bg-[#f6f4ef] animate-pulse sm:h-[480px] sm:rounded-[2rem] xl:h-[620px]" /><div className="h-[360px] rounded-[1.4rem] bg-[#f6f4ef] animate-pulse sm:h-[480px] sm:rounded-[2rem] xl:h-[620px]" /></div></div></section>;
  if (!product) return <section className="bg-white py-16"><div className="container"><div className="rounded-[2rem] border border-dashed border-border p-20 text-center text-muted-foreground">Produit introuvable.</div></div></section>;

  const gallery = getProductGalleryImages(product);
  const brand = getProductBrand(product);
  const oldPrice = getProductOldPrice(product);
  const promoBadge = getProductPromoBadge(product);
  const specs = getProductSpecs(product);
  const description = String(product.description_web || "").trim() || `${product.designation} fait partie de notre selection premium, ideale pour completer votre routine de soin avec confiance et serenite.`;
  const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : 4.8;
  const detailedSpecs = specs.length ? specs : [
    { label: "Marque", value: brand }, { label: "Code article", value: product.code_article },
    { label: "Code barre", value: product.code_barre || "-" }, { label: "Forme", value: product.forme || "Parapharmacie" },
    { label: "TVA", value: `${Number(product.tva || 0).toFixed(2)} %` },
  ];

  function openNextImage(direction: -1 | 1) { setActiveImage((current) => { const next = current + direction; if (next < 0) return gallery.length - 1; if (next >= gallery.length) return 0; return next; }); }
  function submitReview() { if (!reviewName.trim() || !reviewComment.trim()) { toast.error("Nom et commentaire sont obligatoires."); return; } reviewMutation.mutate(); }

  return (
    <section className="bg-[#faf6f1] py-8 lg:py-12">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#8a7764]">
          <a href="/" className="hover:text-[#25323d]">Accueil</a>
          {breadcrumb.map((item) => (<span key={item.slug} className="flex items-center gap-3"><span>/</span><a href={`/categorie/${item.slug}`} className="hover:text-[#25323d]">{item.name}</a></span>))}
          <span className="flex items-center gap-3"><span>/</span><strong className="text-[#25323d]">{product.designation}</strong></span>
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.25rem] border border-[#eadfd3] bg-white p-3 shadow-card sm:rounded-[1.7rem] sm:p-4 lg:p-5">
            <div className="grid gap-3 lg:grid-cols-[76px_minmax(0,1fr)]">
              <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 lg:order-none lg:flex-col lg:overflow-visible lg:pb-0">
                {gallery.map((image, thumb) => (<button key={`${image}-${thumb}`} type="button" onClick={() => setActiveImage(thumb)} className={`flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[0.9rem] border bg-[#fffdf9] p-1.5 transition-smooth sm:h-[76px] sm:w-[76px] sm:rounded-[1rem] ${activeImage === thumb ? "border-[#caa182] shadow-soft" : "border-[#e9dfd2]"}`}><img src={image} alt={product.designation} className="max-h-full max-w-full object-contain" /></button>))}
              </div>
              <div className="relative order-1 flex min-h-[300px] items-center justify-center overflow-hidden rounded-[1.1rem] bg-[#fffdfa] p-3 sm:min-h-[380px] sm:rounded-[1.3rem] sm:p-4 lg:order-none lg:min-h-[440px] lg:rounded-[1.5rem]">
                <span className="absolute left-3 top-3 max-w-[58%] truncate rounded-full bg-[#e5ba9c] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:left-4 sm:top-4 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em]">{getProductCategory(product)}</span>
                <div className="absolute right-3 top-3 flex items-center gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
                  {promoBadge ? <span className="rounded-full bg-[#e11d48] px-2.5 py-1 text-[10px] font-semibold text-white sm:px-3 sm:py-1.5 sm:text-[11px]">{promoBadge}</span> : null}
                  <button type="button" onClick={() => setZoomOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eadfd0] bg-white text-[#7e6a59] transition-smooth hover:text-[#22303a] sm:h-9 sm:w-9"><Search className="h-4 w-4" /></button>
                </div>
                {gallery.length > 1 ? (<><button type="button" onClick={() => openNextImage(-1)} className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#22303a] shadow-soft sm:left-4 sm:h-9 sm:w-9"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => openNextImage(1)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#22303a] shadow-soft sm:right-4 sm:h-9 sm:w-9"><ChevronRight className="h-4 w-4" /></button></>) : null}
                <button type="button" onClick={() => setZoomOpen(true)} className="flex h-full w-full items-center justify-center"><img src={gallery[activeImage] || gallery[0] || getProductImage(product)} alt={product.designation} className="max-h-[260px] max-w-full object-contain transition duration-300 hover:scale-[1.05] sm:max-h-[340px] lg:max-h-[410px]" /></button>
              </div>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-[#eadfd3] bg-white p-4 shadow-card sm:rounded-[2rem] sm:p-5 lg:p-6">
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
              <div className="min-w-0">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#b08968] sm:text-sm sm:tracking-[0.24em]">{brand} - Reference {product.code_article}</p>
                <h1 className="mt-2 max-w-[15ch] text-[1.7rem] font-semibold leading-[1.08] text-[#22303a] sm:mt-3 sm:text-[2.1rem] lg:max-w-none lg:text-[3rem] xl:text-[3.2rem]">{product.designation}</h1>
              </div>
              <div className="w-full sm:max-w-[184px] lg:justify-self-end">
                <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b6b57]">Disponibilite</div>
                <div className="text-[0.82rem] font-semibold leading-snug text-[#15803d]">Disponible a la commande</div>
              </div>
            </div>
            <div className="mt-4 h-[2px] w-24 bg-[#eb8d63]" />
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:gap-5">
              <div className="space-y-2">
                <div className="text-sm uppercase tracking-[0.24em] text-[#8a7764]">Prix de vente</div>
                {oldPrice ? <div className="text-[1rem] text-[#94a3b8] line-through sm:text-[1.25rem]">{formatMoney(oldPrice)}</div> : null}
                <div className="font-price text-[2.4rem] leading-none text-[#c61e2d] sm:text-[3rem] lg:text-[3.3rem]">{formatMoney(product.prix_vente_ttc || 0)}</div>
                <div className="text-base text-[#617182]">Prix HT : {formatMoney((product as Product & { prix_vente_ht?: number | null }).prix_vente_ht || 0)}</div>
                {promoBadge ? <div className="inline-flex rounded-full bg-[#fff1f2] px-4 py-1.5 text-sm font-semibold text-[#e11d48]">Offre en cours : {promoBadge}</div> : null}
              </div>
              <div className="rounded-[1.1rem] bg-[#f7f6f2] p-3 sm:rounded-[1.4rem] sm:p-4">
                <div className="text-lg font-semibold text-[#22303a]">Informations produit</div>
                <div className="mt-3 space-y-1.5 text-[0.9rem] leading-6 text-[#415161] sm:text-[0.98rem] sm:leading-7">
                  <div>- Marque : {brand}</div><div>- Code article : {product.code_article}</div><div>- Code barre : {product.code_barre || "-"}</div><div>- Famille : {getProductCategory(product)}</div><div>- Forme : {product.forme || "Parapharmacie"}</div><div>- TVA : {Number(product.tva || 0).toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-[80px_1fr_1fr] lg:grid-cols-[92px_1fr_1fr]">
              <div className="flex h-11 items-center justify-center rounded-xl border border-[#d7dee7] bg-white text-sm font-semibold text-[#22303a] sm:h-12 sm:text-base">1</div>
              <Button className="h-11 rounded-xl bg-[#18a56f] px-4 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-white hover:bg-[#128c5f] sm:h-12 sm:px-5 sm:text-sm sm:tracking-[0.06em]" onClick={() => onAddToCart(product)}><ShoppingBag className="mr-2 h-4 w-4" />Ajouter au panier</Button>
              <Button className="h-11 rounded-xl bg-[#22303a] px-4 text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-white hover:bg-[#172129] sm:h-12 sm:px-5 sm:text-sm sm:tracking-[0.06em]" onClick={() => onBuyNow(product)}>Acheter maintenant</Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[#d4a186]">
              <ReviewStars rating={averageRating} /><span className="ml-2 text-base text-[#64748b]">{averageRating.toFixed(1)}/5 - {reviews.length} avis client{reviews.length > 1 ? "s" : ""}</span>
            </div>
            <div className="mt-5 rounded-[1.4rem] bg-[#f5f8fb] p-4">
              <div className="flex items-start gap-3"><div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#18a56f] shadow-soft"><Truck className="h-5 w-5" /></div><div><p className="text-lg font-medium text-[#22303a]">Livraison a domicile offerte des 99,000 TND d'achats dans toute la Tunisie.</p><p className="mt-1 text-sm text-[#18a56f]">Paiement securise, preparation rapide et suivi de commande simplifie.</p></div></div>
            </div>
            <div className="mt-7 overflow-hidden rounded-[1.45rem] border border-[#e3ebf4]">
              <div className="flex flex-wrap border-b border-[#dfe8f1] bg-[#eef4fb]">
                {[{ key: "description", label: "Description" }, { key: "reviews", label: "Avis clients" }, { key: "specs", label: "Caracteristiques" }].map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as "description" | "reviews" | "specs")} className={`relative px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.14em] ${activeTab === tab.key ? "bg-[#18a56f] text-white" : "text-[#22303a]"}`}>{tab.label}{activeTab === tab.key ? <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#18a56f]" /> : null}</button>
                ))}
              </div>
              <div className="bg-white p-4 sm:p-5 lg:p-6">
                {activeTab === "description" ? <div className="space-y-4 text-[1rem] leading-7 text-[#495a6b]">{description.split(/\n+/).filter(Boolean).map((paragraph, index) => (<p key={index}>{paragraph}</p>))}</div> : null}
                {activeTab === "reviews" ? (
                  <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3 border-b border-[#edf2f7] pb-5"><ReviewStars rating={averageRating} /><span className="text-lg font-medium text-[#22303a]">{averageRating.toFixed(1)}/5</span><span className="text-base text-[#64748b]">Base sur {reviews.length} avis clients</span></div>
                      {reviews.length ? reviews.map((review) => (<article key={review.id} className="rounded-[1.5rem] border border-[#edf2f7] bg-[#fcfaf7] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#22303a]">{review.review_title || review.customer_name}</h3><p className="text-sm text-[#7b8794]">{review.customer_name} - {review.created_at ? new Date(review.created_at).toLocaleDateString("fr-FR") : "-"}</p></div><ReviewStars rating={Number(review.rating || 0)} /></div><p className="mt-4 leading-7 text-[#495a6b]">{review.comment}</p></article>)) : <div className="rounded-[1.5rem] border border-dashed border-[#e4d8cc] p-8 text-center text-[#64748b]">Aucun avis n'a encore ete publie pour ce produit.</div>}
                    </div>
                    <div className="rounded-[1.5rem] border border-[#edf2f7] bg-[#fcfaf7] p-6">
                      <h3 className="text-2xl font-semibold text-[#22303a]">Laisser votre avis</h3>
                      <div className="mt-5 space-y-4">
                        <Input value={reviewName} onChange={(event) => setReviewName(event.target.value)} placeholder="Votre nom" className="h-12 rounded-xl border-[#d8dee6]" />
                        <Input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Titre de votre avis" className="h-12 rounded-xl border-[#d8dee6]" />
                        <div><div className="mb-3 text-sm font-medium text-[#22303a]">Note</div><StarRatingInput rating={reviewRating} onChange={setReviewRating} /></div>
                        <Textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Votre retour sur ce produit" className="min-h-[150px] rounded-xl border-[#d8dee6]" />
                        <Button type="button" onClick={submitReview} disabled={reviewMutation.isPending} className="w-full rounded-xl bg-[#22303a] text-white hover:bg-[#172129]">{reviewMutation.isPending ? "Envoi..." : "Publier mon avis"}</Button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {activeTab === "specs" ? <div className="grid gap-4">{detailedSpecs.map((item, index) => (<div key={`${item.label}-${index}`} className="grid gap-2 rounded-[1.2rem] border border-[#edf2f7] bg-[#fcfaf7] px-5 py-4 md:grid-cols-[240px_minmax(0,1fr)]"><div className="font-semibold text-[#22303a]">{item.label}</div><div className="text-[#495a6b]">{item.value}</div></div>))}</div> : null}
              </div>
            </div>
          </div>
        </div>
        <section className="mt-14">
          <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.22em] text-[#b08968]">Selection liee</p><h2 className="mt-2 text-3xl font-semibold text-[#22303a]">Produits similaires</h2></div></div>
          {similarProducts.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">{similarProducts.map((item) => (<CategoryProductCard key={item.id} product={item} onAddToCart={onAddToCart} onOpenProduct={onOpenProduct} />))}</div> : <div className="rounded-[2rem] border border-dashed border-[#e5ded3] bg-white p-10 text-center text-[#667787]">Aucun produit similaire n'est encore rattache a cette sous-categorie.</div>}
        </section>
        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-6xl border-none bg-[#111827]/95 p-6 text-white">
            <DialogHeader><DialogTitle className="text-left text-2xl font-semibold">{product.designation}</DialogTitle></DialogHeader>
            <div className="relative flex min-h-[70vh] items-center justify-center">
              {gallery.length > 1 ? (<><button type="button" onClick={() => openNextImage(-1)} className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"><ChevronLeft className="h-6 w-6" /></button><button type="button" onClick={() => openNextImage(1)} className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10"><ChevronRight className="h-6 w-6" /></button></>) : null}
              <img src={gallery[activeImage] || gallery[0] || getProductImage(product)} alt={product.designation} className="max-h-[72vh] max-w-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const normalized = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex items-center gap-1 text-[#d4a186]">
      {[0, 1, 2, 3, 4].map((index) => {
        const filled = normalized >= index + 1;
        const halfFilled = !filled && normalized > index;
        return (
          <span key={index} className="relative">
            <Star className="h-5 w-5 text-[#e7d0c1]" />
            {filled ? <Star className="absolute inset-0 h-5 w-5 fill-current text-[#d4a186]" /> : halfFilled ? <span className="absolute inset-0 overflow-hidden" style={{ width: `${(normalized - index) * 100}%` }}><Star className="h-5 w-5 fill-current text-[#d4a186]" /></span> : null}
          </span>
        );
      })}
    </div>
  );
}

function StarRatingInput({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-[#d4a186]">
      {[1, 2, 3, 4, 5].map((value) => (
        <button key={value} type="button" onClick={() => onChange(value)}>
          <Star className={`h-6 w-6 ${rating >= value ? "fill-current text-[#d4a186]" : "text-[#e7d0c1]"}`} />
        </button>
      ))}
    </div>
  );
}

function CategoryCatalogPage({ title, breadcrumb, products, totalProducts, loading, brands, selectedBrands, selectedPriceRange, selectedAvailability, onToggleBrand, onSelectPriceRange, onSelectAvailability, leafCategories, selectedLeafSlug, onSelectLeafSlug, onClearFilters, sortOption, onSortChange, perPage, onPerPageChange, currentPage, totalPages, onPageChange, onAddToCart, onOpenProduct }: {
  title: string; breadcrumb: string[]; products: Product[]; totalProducts: number; loading: boolean;
  brands: string[]; selectedBrands: string[]; selectedPriceRange: string; selectedAvailability: string;
  onToggleBrand: (brand: string) => void; onSelectPriceRange: (range: string) => void; onSelectAvailability: (range: string) => void;
  leafCategories: WebCategory[]; selectedLeafSlug: string; onSelectLeafSlug: (slug: string) => void;
  onClearFilters: () => void; sortOption: string; onSortChange: (value: string) => void;
  perPage: string; onPerPageChange: (value: string) => void; currentPage: number; totalPages: number;
  onPageChange: (page: number) => void; onAddToCart: (product: Product) => void; onOpenProduct: (product: Product) => void;
}) {
  const [brandQuery, setBrandQuery] = useState("");
  const [leafQuery, setLeafQuery] = useState("");
  const filteredLeafCategories = leafCategories.filter((category) => normalizeText(category.name).includes(normalizeText(leafQuery)));
  const filteredBrands = brands.filter((brand) => normalizeText(brand).includes(normalizeText(brandQuery)));

  return (
    <section id="category-page" className="bg-white py-12 lg:py-16">
      <div className="container">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm uppercase tracking-[0.22em] text-[#9f7d61]">{breadcrumb.join(" / ")}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div><h1 className="text-3xl font-semibold text-[#1f2937] sm:text-4xl lg:text-5xl">{title}</h1><div className="mt-5 h-[2px] w-32 bg-[#eb8d63]" /></div>
            <div className="rounded-full border border-[#eadfd3] bg-[#faf7f2] px-4 py-2 text-xs text-[#51606f] sm:px-5 sm:text-sm">{totalProducts} produit{totalProducts > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8">
          <aside className="space-y-3 sm:space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center justify-between rounded-2xl border border-[#efe4d8] bg-[#fffaf4] px-4 py-3">
              <div><div className="text-[11px] uppercase tracking-[0.22em] text-[#b08968]">Navigation</div><h2 className="mt-1 text-[1.35rem] font-semibold text-[#22303a] sm:text-[1.5rem]">Filtres</h2></div>
              <Button type="button" variant="outline" className="h-9 rounded-full border-[#efc9d3] bg-[#ea5b79] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#d84e6b]" onClick={onClearFilters}>Reset</Button>
            </div>
            <FilterCard title="Disponibilite" countLabel="1 option">
              {[{ value: "all", label: "Tout" }].map((option) => (<FilterRadio key={option.value} checked={selectedAvailability === option.value} label={option.label} onChange={() => onSelectAvailability(option.value)} />))}
            </FilterCard>
            {leafCategories.length ? (
              <FilterCard title="Sous-categorie" countLabel={`${leafCategories.length} options`}>
                {leafCategories.length > 8 ? <FilterSearch value={leafQuery} onChange={setLeafQuery} placeholder="Rechercher une sous-categorie" /> : null}
                <div className={leafCategories.length > 8 ? "max-h-[280px] space-y-1.5 overflow-y-auto pr-1" : "space-y-1.5"}>
                  <FilterRadio checked={selectedLeafSlug === "all"} label="Toutes" onChange={() => onSelectLeafSlug("all")} />
                  {filteredLeafCategories.map((category) => (<FilterRadio key={category.slug} checked={selectedLeafSlug === category.slug} label={category.name} onChange={() => onSelectLeafSlug(category.slug)} />))}
                </div>
              </FilterCard>
            ) : null}
            <FilterCard title="Marque" countLabel={`${brands.length} marques`}>
              {brands.length > 8 ? <FilterSearch value={brandQuery} onChange={setBrandQuery} placeholder="Rechercher une marque" /> : null}
              <div className={brands.length > 8 ? "max-h-[320px] space-y-1.5 overflow-y-auto pr-1" : "space-y-1.5"}>
                {filteredBrands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[0.94rem] leading-5 text-[#334155] transition-colors hover:bg-white/70 sm:gap-2.5">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#cdbba9] accent-[#c86f3d]" checked={selectedBrands.includes(brand)} onChange={() => onToggleBrand(brand)} /><span>{brand}</span>
                  </label>
                ))}
              </div>
            </FilterCard>
            <FilterCard title="Prix" countLabel="4 niveaux">
              {[{ value: "all", label: "Tous" }, { value: "lt50", label: "Moins de 50 DT" }, { value: "50to100", label: "50 DT a 100 DT" }, { value: "gt100", label: "Plus de 100 DT" }].map((option) => (<FilterRadio key={option.value} checked={selectedPriceRange === option.value} label={option.label} onChange={() => onSelectPriceRange(option.value)} />))}
            </FilterCard>
          </aside>
          <div>
            <div className="mb-6 flex flex-col gap-3 rounded-xl bg-[#f7f5f2] px-4 py-4 sm:px-5 lg:mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6">
              <div className="flex items-center gap-3 text-[#22303a]"><Grid2x2 className="h-5 w-5" /><List className="h-5 w-5" /></div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:text-lg text-[#475569]">
                <label className="flex items-center justify-between gap-3 sm:justify-start"><span className="text-sm sm:text-base lg:text-lg">Trier par :</span><select value={sortOption} onChange={(event) => onSortChange(event.target.value)} className="min-w-[148px] rounded-lg border border-[#d9d4cc] bg-white px-3 py-2 text-sm text-[#22303a] sm:px-4 sm:text-base"><option value="default">Par defaut</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix decroissant</option><option value="name-asc">Nom A-Z</option></select></label>
                <label className="flex items-center justify-between gap-3 sm:justify-start"><span className="text-sm sm:text-base lg:text-lg">Voir :</span><select value={perPage} onChange={(event) => onPerPageChange(event.target.value)} className="min-w-[92px] rounded-lg border border-[#d9d4cc] bg-white px-3 py-2 text-sm text-[#22303a] sm:px-4 sm:text-base"><option value="12">12</option><option value="24">24</option><option value="48">48</option></select></label>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 6 }).map((_, index) => (<div key={index} className="h-[330px] rounded-2xl border border-border bg-card animate-pulse sm:h-[430px]" />))}</div>
            ) : products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">Aucun produit trouve pour cette categorie.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{products.map((product) => (<CategoryProductCard key={product.id} product={product} onAddToCart={onAddToCart} onOpenProduct={onOpenProduct} />))}</div>
                <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterCard({ title, countLabel, children }: { title: string; countLabel?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#efe4d8] bg-[#faf7f2] px-3 py-3 shadow-[0_6px_18px_rgba(80,58,40,0.04)] sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[1.1rem] font-semibold leading-none text-[#22303a] sm:text-[1.2rem]">{title}</h3>
        {countLabel ? <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a77b5f]">{countLabel}</span> : null}
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function FilterSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9a8d81]" />
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full rounded-full border border-[#e2d7ca] bg-white pl-9 pr-3 text-[0.85rem] text-[#22303a] outline-none transition-colors placeholder:text-[#a09386] focus:border-[#d9b89a]" />
    </div>
  );
}

function FilterRadio({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-[0.93rem] leading-5 transition-colors sm:gap-2.5 ${checked ? "bg-white text-[#22303a]" : "text-[#334155] hover:bg-white/70"}`}>
      <input type="radio" className="h-4 w-4 accent-[#b14bd8]" checked={checked} onChange={onChange} /><span>{label}</span>
    </label>
  );
}

function PaginationBar({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = buildPaginationPages(currentPage, totalPages);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Button type="button" variant="outline" className="h-10 rounded-full border-[#e4d8cb] px-4 text-sm text-[#22303a] hover:bg-[#faf5ef]" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Precedent</Button>
      {pages.map((page, index) => page === "ellipsis" ? (<span key={`ellipsis-${index}`} className="flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-[#9a8d81]">...</span>) : (<button key={page} type="button" onClick={() => onPageChange(page)} className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-smooth ${currentPage === page ? "bg-[#22303a] text-white shadow-sm" : "border border-[#e4d8cb] bg-white text-[#22303a] hover:bg-[#faf5ef]"}`}>{page}</button>))}
      <Button type="button" variant="outline" className="h-10 rounded-full border-[#e4d8cb] px-4 text-sm text-[#22303a] hover:bg-[#faf5ef]" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Suivant<ChevronRight className="ml-1 h-4 w-4" /></Button>
    </div>
  );
}

function buildPaginationPages(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3) return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

function CategoryProductCard({ product, onAddToCart, onOpenProduct }: { product: Product; onAddToCart: (product: Product) => void; onOpenProduct: (product: Product) => void }) {
  const brand = getProductBrand(product);
  const oldPrice = getProductOldPrice(product);
  const promoBadge = getProductPromoBadge(product);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-[#f0e8df] bg-white shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div className="relative h-[180px] border-b border-[#f1ece6] bg-white p-2.5 sm:h-[210px] sm:p-3">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#e2b391] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">{brand}</span>
        {promoBadge ? <span className="absolute right-3 top-3 z-10 rounded-lg bg-[#e11d48] px-2 py-1 text-[10px] font-semibold text-white">{promoBadge}</span> : null}
        <button type="button" onClick={() => onOpenProduct(product)} className="flex h-full w-full items-center justify-center"><img src={getProductImage(product)} alt={product.designation} className="max-h-[150px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[180px]" /></button>
      </div>
      <div className="flex flex-1 flex-col space-y-1.5 rounded-t-[1.1rem] bg-[linear-gradient(180deg,#fffdfb_0%,#f8f2eb_100%)] px-3 pb-3 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <button type="button" onClick={() => onOpenProduct(product)} className="text-left"><h3 className="min-h-[36px] font-sans text-[0.94rem] font-medium leading-[1.15rem] text-[#334155] line-clamp-2">{product.designation}</h3></button>
        <div className="space-y-0.5">{oldPrice ? <div className="text-[0.82rem] text-[#94a3b8] line-through">{formatMoney(oldPrice)}</div> : null}<div className="font-price text-[1.4rem] leading-none text-[#c61e2d]">{formatMoney(product.prix_vente_ttc || 0)}</div></div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[0.8rem] font-medium text-[#12a05c] sm:text-[0.92rem]">Disponible</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button type="button" variant="outline" className="h-8 rounded-full border-[#d7ccb7] bg-white px-2.5 text-[0.82rem] text-[#22303a] sm:px-3 sm:text-[0.9rem]" onClick={() => onOpenProduct(product)}><Eye className="mr-1.5 h-3.5 w-3.5" />Voir</Button>
            <Button type="button" variant="outline" className="h-8 w-8 shrink-0 rounded-full border-[#cfd8e3] bg-white p-0" onClick={() => onAddToCart(product)}><ShoppingBag className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function TrackingCard({ order }: { order: WebOrder }) {
  const statusLabel = getTrackingStatusLabel(order.status);
  return (
    <div className="rounded-[1.2rem] border border-border bg-secondary p-4 sm:rounded-[1.75rem] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.22em] text-accent-deep">Commande</p><h3 className="mt-2 break-all font-display text-[1.6rem] text-primary sm:text-3xl">{order.order_number}</h3><p className="mt-2 text-sm text-muted-foreground">{order.created_at ? new Date(order.created_at).toLocaleString("fr-FR") : "-"}</p></div>
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{statusLabel}</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoBox label="Etat" value={statusLabel} /><InfoBox label="Paiement" value={order.payment_mode || "Paiement a la livraison"} /><InfoBox label="Livraison" value={order.delivery_mode || "Livraison standard"} /><InfoBox label="Frais livraison" value={formatMoney(order.delivery_fee_ttc || 0)} /><InfoBox label="Total TTC" value={formatMoney(order.total_ttc || 0)} /><InfoBox label="Client" value={order.customer_name} />
      </div>
      <div className="mt-6 rounded-2xl bg-background p-4">
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">Lignes de commande</p>
        <div className="space-y-3">
          {(order.items || []).length === 0 ? <div className="text-sm text-muted-foreground">Aucune ligne disponible.</div> : order.items?.map((item) => (
            <div key={`${item.order_id}-${item.product_id}-${item.id || item.quantity}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
              <div><p className="font-medium text-foreground">{item.product?.designation || "Produit"}</p><p className="text-sm text-muted-foreground">{item.product?.code_article || "-"} - {item.product?.forme || "Parapharmacie"}</p></div>
              <div className="text-right"><p className="font-semibold text-primary">x{item.quantity}</p><p className="text-sm text-muted-foreground">{formatMoney(Number(item.unit_price || 0) * Number(item.quantity || 0))}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  const isAmountValue = /\bDT\b/i.test(value) || /montant|total|frais|prix|ttc|ht/i.test(label);
  return (
    <div className="rounded-2xl bg-background p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-primary ${isAmountValue ? "font-sans text-[1.65rem] font-semibold tabular-nums tracking-tight" : "text-lg font-semibold"}`}>{value}</p>
    </div>
  );
}

function getTrackingStatusLabel(status?: string | null) {
  if (status === "Nouvelle") return "Commande recue";
  if (status === "En preparation" || status === "En préparation") return "En preparation";
  if (status === "Expediee" || status === "Expediee") return "Expediee";
  if (status === "Annulee" || status === "Annulee") return "Annulee";
  return status || "Commande recue";
}

function slugifyCategoryLabel(label: string) {
  return normalizeText(label).replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function slugifyProductText(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getProductHref(product: Product) {
  return `/produit/${encodeURIComponent(product.code_article)}/${slugifyProductText(product.designation)}`;
}

function getPrettySlug(slug: string) {
  return slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function findCategoryPath(tree: WebCategory[], slug: string | null | undefined, path: WebCategory[] = []): WebCategory[] {
  if (!slug) return [];
  for (const node of tree) {
    const nextPath = [...path, node];
    if (node.slug === slug) return nextPath;
    const nested = findCategoryPath(node.children || [], slug, nextPath);
    if (nested.length) return nested;
  }
  return [];
}

function collectLeafNodes(node: WebCategory): WebCategory[] {
  if (!node.children?.length) return [node];
  return node.children.flatMap((child) => collectLeafNodes(child));
}

export default Index;
