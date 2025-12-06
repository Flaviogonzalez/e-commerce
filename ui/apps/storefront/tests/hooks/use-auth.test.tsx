import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "~/lib/auth";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("should initialize with unauthenticated state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it("should login user successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user: {
            id: "1",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
          token: "mock-jwt-token",
        }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    await waitFor(() => {
      expect(result.current.user).toEqual({
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("should handle login failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid credentials" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("test@example.com", "wrongpassword");
      })
    ).rejects.toThrow();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should register user successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user: {
            id: "1",
            email: "new@example.com",
            firstName: "New",
            lastName: "User",
          },
          token: "mock-jwt-token",
        }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
      });
    });

    await waitFor(() => {
      expect(result.current.user?.email).toBe("new@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("should logout user", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: {
              id: "1",
              email: "test@example.com",
              firstName: "Test",
              lastName: "User",
            },
            token: "mock-jwt-token",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("should check authentication on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user: {
            id: "1",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
        }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
