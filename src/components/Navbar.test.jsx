import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ModalsContext } from "../contexts/ModalsProvider";

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

import Navbar from "./Navbar";

const renderNavbar = (authValue) => {
  mockUseAuth.mockReturnValue(authValue);

  const modalsContext = {
    activeItem: {},
    currentModal: null,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  };

  return render(
    <ModalsContext.Provider value={modalsContext}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </ModalsContext.Provider>
  );
};

describe("Navbar - Users button visibility", () => {
  it("shows Users button when user has admin role", () => {
    renderNavbar({
      user: { uid: "admin1", displayName: "Admin User" },
      role: "admin",
      admin: true,
      signOutUser: vi.fn(),
    });

    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
  });

  it("hides Users button when user has editor role", () => {
    renderNavbar({
      user: { uid: "editor1", displayName: "Editor User" },
      role: "editor",
      admin: true,
      signOutUser: vi.fn(),
    });

    expect(screen.queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
  });

  it("hides Users button when user has regular user role (empty string)", () => {
    renderNavbar({
      user: { uid: "user1", displayName: "Regular User" },
      role: "",
      admin: false,
      signOutUser: vi.fn(),
    });

    expect(screen.queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
  });

  it("hides Users button when user is unauthenticated", () => {
    renderNavbar({
      user: null,
      role: "",
      admin: false,
      signOutUser: vi.fn(),
    });

    expect(screen.queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
  });
});
