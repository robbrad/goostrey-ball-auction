import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";

// Mock firebase/auth
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockUpdateProfile = vi.fn();
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args) =>
    mockCreateUserWithEmailAndPassword(...args),
  updateProfile: (...args) => mockUpdateProfile(...args),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

// Mock firebase config
vi.mock("../firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
}));

import { SignUpModal } from "./Modal";

const renderSignUpModal = (contextOverrides = {}) => {
  const defaultContext = {
    activeItem: {},
    currentModal: ModalTypes.SIGN_UP,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  };

  return render(
    <ModalsContext.Provider value={{ ...defaultContext, ...contextOverrides }}>
      <SignUpModal />
    </ModalsContext.Provider>
  );
};

describe("SignUpModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form rendering", () => {
    it("renders first name, surname, email, and password fields", () => {
      renderSignUpModal();

      expect(screen.getByPlaceholderText("Enter your first name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your surname")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    });
  });

  describe("Name validation errors", () => {
    it("displays validation error when first name is empty on submit", () => {
      renderSignUpModal();

      // Fill surname so only first name triggers error
      const surnameInput = screen.getByPlaceholderText("Enter your surname");
      fireEvent.change(surnameInput, { target: { value: "Smith", name: "surname" } });

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      const firstNameGroup = screen.getByPlaceholderText("Enter your first name").closest(".form-floating");
      expect(firstNameGroup).toHaveTextContent("Name is required");
    });

    it("displays validation error when surname is whitespace-only on submit", () => {
      renderSignUpModal();

      const firstNameInput = screen.getByPlaceholderText("Enter your first name");
      fireEvent.change(firstNameInput, { target: { value: "Jane", name: "firstName" } });

      const surnameInput = screen.getByPlaceholderText("Enter your surname");
      fireEvent.change(surnameInput, { target: { value: "   ", name: "surname" } });

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    it("displays error when first name is less than 2 characters", () => {
      renderSignUpModal();

      const firstNameInput = screen.getByPlaceholderText("Enter your first name");
      fireEvent.change(firstNameInput, { target: { value: "J", name: "firstName" } });

      const surnameInput = screen.getByPlaceholderText("Enter your surname");
      fireEvent.change(surnameInput, { target: { value: "Smith", name: "surname" } });

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      expect(screen.getByText("Name must be at least 2 characters")).toBeInTheDocument();
    });

    it("displays error when name contains invalid characters", () => {
      renderSignUpModal();

      const firstNameInput = screen.getByPlaceholderText("Enter your first name");
      fireEvent.change(firstNameInput, { target: { value: "Jane123", name: "firstName" } });

      const surnameInput = screen.getByPlaceholderText("Enter your surname");
      fireEvent.change(surnameInput, { target: { value: "Smith", name: "surname" } });

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      expect(
        screen.getByText("Name can only contain letters, hyphens, and apostrophes")
      ).toBeInTheDocument();
    });
  });

  describe("Firebase error display", () => {
    it("displays Firebase error message when createUserWithEmailAndPassword rejects", async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error("Firebase: Error (auth/email-already-in-use).")
      );

      renderSignUpModal();

      const firstNameInput = screen.getByPlaceholderText("Enter your first name");
      fireEvent.change(firstNameInput, { target: { value: "Jane", name: "firstName" } });

      const surnameInput = screen.getByPlaceholderText("Enter your surname");
      fireEvent.change(surnameInput, { target: { value: "Smith", name: "surname" } });

      const emailInput = screen.getByPlaceholderText("Enter your email");
      fireEvent.change(emailInput, { target: { value: "jane@example.com", name: "email" } });

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      fireEvent.change(passwordInput, { target: { value: "password123", name: "password" } });

      fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

      await waitFor(() => {
        const errorDiv = document.querySelector(".invalid-feedback.d-block");
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveTextContent(
          "Firebase: Error (auth/email-already-in-use)."
        );
      });
    });
  });
});
