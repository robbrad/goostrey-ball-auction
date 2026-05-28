import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";

// Mock firebase/auth
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

// Mock firebase/firestore
const mockUpdateDoc = vi.fn();
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => "mock-doc-ref"),
  setDoc: vi.fn(),
  updateDoc: (...args) => mockUpdateDoc(...args),
  getFirestore: vi.fn(),
  Timestamp: { now: () => ({ seconds: 1234567890, nanoseconds: 0 }) },
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
}));

import { ItemModal } from "./Modal";

const createActiveItem = (overrides = {}) => ({
  id: 1,
  title: "Test Item",
  detail: "A test auction item",
  currency: "£",
  startingPrice: 5,
  endTime: Date.now() + 60000, // 1 minute in the future
  secondaryImage: undefined,
  bids: {},
  ...overrides,
});

const renderItemModal = ({ user = null, activeItem = createActiveItem(), contextOverrides = {} } = {}) => {
  mockUseAuth.mockReturnValue({ user });

  const defaultContext = {
    activeItem,
    currentModal: ModalTypes.ITEM,
    openModal: vi.fn(),
    closeModal: vi.fn(),
  };

  const context = { ...defaultContext, ...contextOverrides };

  return {
    ...render(
      <ModalsContext.Provider value={context}>
        <ItemModal />
      </ModalsContext.Provider>
    ),
    context,
  };
};

describe("ItemModal - Bid Validation Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Requirement 3.4: Bid rejection when not signed in", () => {
    it("displays 'must be logged in' message when user is null", () => {
      renderItemModal({ user: null });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      expect(screen.getByText("You must be logged in to place a bid")).toBeInTheDocument();
    });
  });

  describe("Requirement 3.5: Bid rejection when no display name", () => {
    it("displays registration message when user has no displayName", () => {
      renderItemModal({ user: { uid: "123", displayName: null } });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      expect(screen.getByText("You must register before placing a bid")).toBeInTheDocument();
    });

    it("opens sign-up modal after delay when user has no displayName", () => {
      const { context } = renderItemModal({ user: { uid: "123", displayName: null } });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(context.openModal).toHaveBeenCalledWith(ModalTypes.SIGN_UP);
    });
  });

  describe("Requirement 3.3: Bid rejection when item has ended", () => {
    it("displays 'item has ended' message when endTime is in the past", () => {
      const endedItem = createActiveItem({ endTime: Date.now() - 10000 });
      renderItemModal({
        user: { uid: "123", displayName: "Jane Smith" },
        activeItem: endedItem,
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      expect(screen.getByText("Sorry, this item has ended!")).toBeInTheDocument();
    });
  });

  describe("Requirement 3.1, 3.2: Bid rejection when amount too low", () => {
    it("displays error when bid is below minimum required amount", () => {
      const itemWithBids = createActiveItem({
        bids: { 1: { amount: 10, uid: "other-user" } },
      });
      renderItemModal({
        user: { uid: "123", displayName: "Jane Smith" },
        activeItem: itemWithBids,
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "5" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      expect(screen.getByText("Bid must be at least £11.00")).toBeInTheDocument();
    });

    it("displays error when bid is not a valid monetary amount", () => {
      renderItemModal({
        user: { uid: "123", displayName: "Jane Smith" },
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.click(screen.getByRole("button", { name: /submit bid/i }));

      expect(screen.getByText("Please enter a valid monetary amount")).toBeInTheDocument();
    });
  });

  describe("Requirement 3.6: Submit button disabled during submission", () => {
    it("disables submit button while bid is being processed", async () => {
      mockUpdateDoc.mockReturnValue(new Promise(() => {})); // never resolves

      renderItemModal({
        user: { uid: "123", displayName: "Jane Smith" },
      });

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "10" } });

      const submitButton = screen.getByRole("button", { name: /submit bid/i });
      expect(submitButton).not.toBeDisabled();

      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
