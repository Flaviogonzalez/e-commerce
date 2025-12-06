import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { I18nProvider, useI18n } from "~/lib/i18n";

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe("useI18n", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { language: "en-US" });
  });

  it("should initialize with default locale", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    expect(result.current.locale).toBe("en");
  });

  it("should translate keys", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const translated = result.current.t("common.home");
    expect(typeof translated).toBe("string");
  });

  it("should change locale", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLocale("es");
    });

    expect(result.current.locale).toBe("es");
  });

  it("should format numbers", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const formatted = result.current.formatNumber(1234.56);
    expect(formatted).toContain("1");
    expect(formatted).toContain("234");
  });

  it("should format currency", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const formatted = result.current.formatCurrency(99.99);
    expect(formatted).toContain("99");
  });

  it("should format dates", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const date = new Date("2024-01-15");
    const formatted = result.current.formatDate(date);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("should handle interpolation", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const translated = result.current.t("greeting", { name: "World" });
    expect(typeof translated).toBe("string");
  });

  it("should return key if translation missing", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    const translated = result.current.t("nonexistent.key.here");
    expect(translated).toBe("nonexistent.key.here");
  });

  it("should persist locale to localStorage", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLocale("es");
    });

    expect(setItemSpy).toHaveBeenCalledWith("locale", "es");
    setItemSpy.mockRestore();
  });
});
