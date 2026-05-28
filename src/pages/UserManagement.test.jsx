import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock firebase/firestore
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn(() => "mock-doc-ref");
const mockCollection = vi.fn(() => "mock-collection-ref");

vi.mock("firebase/firestore", () => ({
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
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
}));

import UserManagementPage from "./UserManagement";

const createMockQuerySnapshot = (users) => ({
  docs: users.map((u) => ({
    id: u.uid,
    data: () => {
      const { uid, ...rest } = u;
      return rest;
    },
  })),
});

const mockUsers = [
  { uid: "user1", firstName: "Alice", surname: "Smith", email: "alice@example.com", role: "admin" },
  { uid: "user2", firstName: "Bob", surname: "Jones", email: "bob@example.com", role: "editor" },
  { uid: "user3", firstName: "Charlie", surname: "Brown", email: "charlie@example.com", role: "" },
];

describe("UserManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: "user1", displayName: "Alice Smith" }, role: "admin" });
  });

  describe("Loading state", () => {
    it("renders spinner while loading users", () => {
      mockGetDocs.mockReturnValue(new Promise(() => {})); // never resolves
      render(<UserManagementPage />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("renders error alert when Firestore fetch fails", async () => {
      mockGetDocs.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(<UserManagementPage />);
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Could not load users. Please try again.")).toBeInTheDocument();
    });

    it("renders retry button when fetch fails", async () => {
      mockGetDocs.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(<UserManagementPage />);
      });

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe("Empty user list", () => {
    it("renders 'no users found' message when collection is empty", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot([]));

      await act(async () => {
        render(<UserManagementPage />);
      });

      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  describe("RoleSelector disabled for current user", () => {
    it("disables RoleSelector for the currently signed-in admin", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockUsers));

      await act(async () => {
        render(<UserManagementPage />);
      });

      const currentUserSelect = screen.getByLabelText("Role for Alice Smith");
      expect(currentUserSelect).toBeDisabled();
    });

    it("shows helper text for current user indicating role cannot be changed", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockUsers));

      await act(async () => {
        render(<UserManagementPage />);
      });

      expect(screen.getByText("You cannot change your own role")).toBeInTheDocument();
    });

    it("does not disable RoleSelector for other users", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockUsers));

      await act(async () => {
        render(<UserManagementPage />);
      });

      const otherUserSelect = screen.getByLabelText("Role for Bob Jones");
      expect(otherUserSelect).not.toBeDisabled();
    });
  });

  describe("Role change success", () => {
    it("triggers Firestore write and shows success message on role change", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockUsers));
      mockUpdateDoc.mockResolvedValue(undefined);

      await act(async () => {
        render(<UserManagementPage />);
      });

      const bobSelect = screen.getByLabelText("Role for Bob Jones");

      await act(async () => {
        fireEvent.change(bobSelect, { target: { value: "admin" } });
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { role: "admin" });
      expect(screen.getByText("Role updated successfully.")).toBeInTheDocument();
    });
  });

  describe("Role change failure", () => {
    it("reverts selector and shows error message on failed role change", async () => {
      mockGetDocs.mockResolvedValue(createMockQuerySnapshot(mockUsers));
      mockUpdateDoc.mockRejectedValue(new Error("Permission denied"));

      await act(async () => {
        render(<UserManagementPage />);
      });

      const bobSelect = screen.getByLabelText("Role for Bob Jones");
      expect(bobSelect.value).toBe("editor");

      await act(async () => {
        fireEvent.change(bobSelect, { target: { value: "admin" } });
      });

      expect(screen.getByText("Failed to update role. Please try again.")).toBeInTheDocument();
      // Selector should revert to previous value
      expect(bobSelect.value).toBe("editor");
    });
  });
});
