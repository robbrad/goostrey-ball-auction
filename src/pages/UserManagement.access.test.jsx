import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  collection: vi.fn(),
  getFirestore: vi.fn(),
}));

// Mock firebase config
vi.mock("../firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("../contexts/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => children,
}));

import UserManagementPage from "./UserManagement";

/**
 * Inline ProtectedRoute matching the logic in App.jsx.
 * We replicate it here to test the access control behaviour in isolation.
 */
function ProtectedRoute({ children, roles }) {
  const { user, role, admin } = mockUseAuth();

  if (roles) {
    const effectiveRole = role || (admin ? "admin" : "");
    return roles.includes(effectiveRole)
      ? children
      : <Navigate to="/" />;
  }

  return user ? children : <Navigate to="/" />;
}

const renderWithRoute = (authValue) => {
  mockUseAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("Route access control - /users", () => {
  it("renders UserManagementPage when user has admin role", () => {
    renderWithRoute({
      user: { uid: "admin1", displayName: "Admin User" },
      role: "admin",
      admin: true,
    });

    // The page renders (shows loading spinner from UserManagementPage) rather than redirecting
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
  });

  it("redirects to home when user has editor role", () => {
    renderWithRoute({
      user: { uid: "editor1", displayName: "Editor User" },
      role: "editor",
      admin: true,
    });

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
  });

  it("redirects to home when user has regular user role", () => {
    renderWithRoute({
      user: { uid: "user1", displayName: "Regular User" },
      role: "",
      admin: false,
    });

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
  });

  it("redirects to home when user is unauthenticated", () => {
    renderWithRoute({
      user: null,
      role: "",
      admin: false,
    });

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
  });
});
