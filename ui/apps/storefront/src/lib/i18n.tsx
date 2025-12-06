import * as React from "react";

type Locale = "en" | "es";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "search.placeholder": "Search products...",
    "cart.empty": "Your cart is empty",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.continue": "Continue Shopping",
    "product.addToCart": "Add to Cart",
    "product.addToWishlist": "Add to Wishlist",
    "product.outOfStock": "Out of Stock",
    "product.inStock": "In Stock",
    "product.reviews": "reviews",
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.logout": "Sign Out",
    "auth.forgotPassword": "Forgot Password?",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "checkout.shipping": "Shipping",
    "checkout.payment": "Payment",
    "checkout.review": "Review",
    "checkout.placeOrder": "Place Order",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.billingAddress": "Billing Address",
    "checkout.paymentMethod": "Payment Method",
    "account.orders": "Orders",
    "account.addresses": "Addresses",
    "account.profile": "Profile",
    "account.wishlist": "Wishlist",
    "home.hero.title": "Discover Premium Products",
    "home.hero.subtitle": "Shop the latest trends and exclusive deals",
    "home.hero.cta": "Shop Now",
    "home.featured.title": "Featured Products",
    "home.categories.title": "Shop by Category",
    "home.newsletter.title": "Stay Updated",
    "home.newsletter.subtitle": "Subscribe for exclusive offers and updates",
    "home.newsletter.placeholder": "Enter your email",
    "home.newsletter.button": "Subscribe",
    "error.404.title": "Page Not Found",
    "error.404.message": "The page you're looking for doesn't exist.",
    "error.500.title": "Server Error",
    "error.500.message": "Something went wrong. Please try again later.",
    "error.goHome": "Go Home",
  },
  es: {
    "search.placeholder": "Buscar productos...",
    "cart.empty": "Tu carrito está vacío",
    "cart.total": "Total",
    "cart.checkout": "Finalizar Compra",
    "cart.continue": "Continuar Comprando",
    "product.addToCart": "Añadir al Carrito",
    "product.addToWishlist": "Añadir a Favoritos",
    "product.outOfStock": "Agotado",
    "product.inStock": "En Stock",
    "product.reviews": "reseñas",
    "auth.login": "Iniciar Sesión",
    "auth.register": "Crear Cuenta",
    "auth.logout": "Cerrar Sesión",
    "auth.forgotPassword": "¿Olvidaste tu Contraseña?",
    "auth.email": "Correo Electrónico",
    "auth.password": "Contraseña",
    "auth.name": "Nombre Completo",
    "checkout.shipping": "Envío",
    "checkout.payment": "Pago",
    "checkout.review": "Revisar",
    "checkout.placeOrder": "Realizar Pedido",
    "checkout.shippingAddress": "Dirección de Envío",
    "checkout.billingAddress": "Dirección de Facturación",
    "checkout.paymentMethod": "Método de Pago",
    "account.orders": "Pedidos",
    "account.addresses": "Direcciones",
    "account.profile": "Perfil",
    "account.wishlist": "Favoritos",
    "home.hero.title": "Descubre Productos Premium",
    "home.hero.subtitle": "Compra las últimas tendencias y ofertas exclusivas",
    "home.hero.cta": "Comprar Ahora",
    "home.featured.title": "Productos Destacados",
    "home.categories.title": "Comprar por Categoría",
    "home.newsletter.title": "Mantente Actualizado",
    "home.newsletter.subtitle": "Suscríbete para ofertas exclusivas y actualizaciones",
    "home.newsletter.placeholder": "Ingresa tu correo",
    "home.newsletter.button": "Suscribirse",
    "error.404.title": "Página No Encontrada",
    "error.404.message": "La página que buscas no existe.",
    "error.500.title": "Error del Servidor",
    "error.500.message": "Algo salió mal. Por favor intenta más tarde.",
    "error.goHome": "Ir al Inicio",
  },
};

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({
  children,
  defaultLocale = "en",
}: I18nProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }
    try {
      const stored = localStorage.getItem("locale");
      if (stored && (stored === "en" || stored === "es")) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
    return defaultLocale;
  });

  const setLocale = React.useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem("locale", newLocale);
    } catch {
      // localStorage not available
    }
    setLocaleState(newLocale);
  }, []);

  const t = React.useCallback(
    (key: string, params?: Record<string, string>) => {
      let translation = translations[locale][key] ?? translations.en[key] ?? key;
      
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          translation = translation.replace(`{${k}}`, v);
        });
      }
      
      return translation;
    },
    [locale]
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    // Return default implementation if provider not available
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => translations.en[key] ?? key,
    };
  }
  return context;
}

export { type Locale };
