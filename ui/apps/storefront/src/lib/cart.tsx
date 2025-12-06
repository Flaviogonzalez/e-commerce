import * as React from "react";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    id: string;
    name: string;
    value: string;
  };
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "cart";
const CART_DB_NAME = "CartDB";
const CART_STORE_NAME = "cart";

// IndexedDB helper functions
async function openCartDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CART_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CART_STORE_NAME)) {
        db.createObjectStore(CART_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function saveToIndexedDB(items: CartItem[]): Promise<void> {
  try {
    const db = await openCartDB();
    const transaction = db.transaction(CART_STORE_NAME, "readwrite");
    const store = transaction.objectStore(CART_STORE_NAME);
    
    // Clear existing items
    store.clear();
    
    // Add all items
    items.forEach((item) => store.add(item));
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    // IndexedDB not available, fall back to localStorage
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}

async function loadFromIndexedDB(): Promise<CartItem[]> {
  try {
    const db = await openCartDB();
    const transaction = db.transaction(CART_STORE_NAME, "readonly");
    const store = transaction.objectStore(CART_STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load cart from storage on mount
  React.useEffect(() => {
    loadFromIndexedDB().then((loadedItems) => {
      setItems(loadedItems);
      setIsLoading(false);
    });
  }, []);

  // Save cart to storage whenever items change
  React.useEffect(() => {
    if (!isLoading) {
      saveToIndexedDB(items);
    }
  }, [items, isLoading]);

  const itemCount = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = React.useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const addItem = React.useCallback((item: Omit<CartItem, "id">) => {
    setItems((prevItems) => {
      // Check if item already exists with same variant
      const existingIndex = prevItems.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.variant?.id === item.variant?.id
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const newItems = [...prevItems];
        const existing = newItems[existingIndex];
        if (existing) {
          existing.quantity += item.quantity;
        }
        return newItems;
      }

      // Add new item
      return [
        ...prevItems,
        {
          ...item,
          id: crypto.randomUUID(),
        },
      ];
    });
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = React.useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const value = React.useMemo(
    () => ({
      items,
      itemCount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isLoading,
    }),
    [items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    // Return default implementation if provider not available
    return {
      items: [],
      itemCount: 0,
      total: 0,
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      isLoading: false,
    };
  }
  return context;
}
