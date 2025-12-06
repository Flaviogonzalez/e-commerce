import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { CartProvider, useCart } from "~/lib/cart";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("useCart", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", undefined);
  });

  it("should initialize with empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("should add item to cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 1,
        image: "/test.jpg",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Test Product");
    expect(result.current.itemCount).toBe(1);
    expect(result.current.total).toBe(29.99);
  });

  it("should increase quantity when adding existing item", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 1,
        image: "/test.jpg",
      });
    });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 2,
        image: "/test.jpg",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.itemCount).toBe(3);
  });

  it("should remove item from cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 1,
        image: "/test.jpg",
      });
    });

    act(() => {
      result.current.removeItem("1");
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
  });

  it("should update item quantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 1,
        image: "/test.jpg",
      });
    });

    act(() => {
      result.current.updateQuantity("1", 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.itemCount).toBe(5);
    expect(result.current.total).toBeCloseTo(149.95);
  });

  it("should remove item when quantity is set to 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Test Product",
        price: 29.99,
        quantity: 1,
        image: "/test.jpg",
      });
    });

    act(() => {
      result.current.updateQuantity("1", 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("should clear cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Product 1",
        price: 29.99,
        quantity: 1,
        image: "/test1.jpg",
      });
      result.current.addItem({
        id: "2",
        name: "Product 2",
        price: 49.99,
        quantity: 2,
        image: "/test2.jpg",
      });
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("should calculate total correctly with multiple items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "1",
        name: "Product 1",
        price: 10.0,
        quantity: 2,
        image: "/test1.jpg",
      });
      result.current.addItem({
        id: "2",
        name: "Product 2",
        price: 25.0,
        quantity: 1,
        image: "/test2.jpg",
      });
    });

    expect(result.current.total).toBe(45.0);
    expect(result.current.itemCount).toBe(3);
  });
});
