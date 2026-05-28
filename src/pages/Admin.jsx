import { useState, useContext, useCallback } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { editItems, deleteItem } from "../firebase/utils";
import { formatField } from "../utils/formatString";
import { ItemsContext } from "../contexts/ItemsProvider";
import { useAuth } from "../contexts/AuthProvider";
import { generateCSV } from "../utils/exportCSV";
import Table from "../components/Table";
import Dashboard from "../components/Dashboard";
import ItemFormModal from "../components/ItemFormModal";
import BidderListModal from "../components/BidderListModal";
import { ReservePriceInput } from "../components/ReservePriceInput";

function AdminPage() {
  const { items } = useContext(ItemsContext);
  const { role } = useAuth();
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success");

  // Item form modal state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Bidder list modal state
  const [showBidderList, setShowBidderList] = useState(false);
  const [bidderListItem, setBidderListItem] = useState(null);

  const showMessage = (message, type = "success") => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleUpdateAll = async () => {
    try {
      await editItems(undefined, true, false);
      showMessage("Update All completed successfully.");
    } catch (error) {
      console.error("Update All failed:", error);
      showMessage(
        error.message === "CONFIG_LOAD_FAILED"
          ? "Configuration could not be loaded."
          : "Update All failed. Please try again.",
        "danger"
      );
    }
  };

  const handleResetAll = async () => {
    if (role !== "admin") {
      showMessage("Insufficient permissions", "danger");
      return;
    }
    try {
      await editItems(undefined, false, true);
      showMessage("Reset All completed successfully.");
    } catch (error) {
      console.error("Reset All failed:", error);
      showMessage("Reset All failed. Please try again.", "danger");
    }
  };

  const handleUpdateAndResetAll = async () => {
    try {
      await editItems(undefined, true, true);
      showMessage("Update & Reset All completed successfully.");
    } catch (error) {
      console.error("Update & Reset All failed:", error);
      showMessage(
        error.message === "CONFIG_LOAD_FAILED"
          ? "Configuration could not be loaded."
          : "Update & Reset All failed. Please try again.",
        "danger"
      );
    }
  };

  const handleDelete = useCallback(async (itemId) => {
    try {
      await deleteItem(itemId);
      showMessage("Item deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      showMessage("Delete failed. Please try again.", "danger");
    }
  }, []);

  const handleReservePriceChange = useCallback(async (itemId, value) => {
    const fieldKey = formatField(itemId, 0);
    const reservePrice = value === "" ? null : parseFloat(value);
    const docRef = doc(db, "auction", "items");
    try {
      await updateDoc(docRef, {
        [`${fieldKey}.reservePrice`]: reservePrice,
      });
    } catch (error) {
      console.error("Failed to save reserve price:", error);
      showMessage("Failed to save reserve price. Please try again.", "danger");
    }
  }, []);

  // Add Item button handler
  const handleAddItem = () => {
    setEditItem(null);
    setShowItemForm(true);
  };

  // Edit item callback (passed to Table/Row)
  const handleEdit = useCallback((item) => {
    setEditItem(item);
    setShowItemForm(true);
  }, []);

  // Show bidders callback (passed to Table/Row)
  const handleShowBidders = useCallback((item) => {
    setBidderListItem(item);
    setShowBidderList(true);
  }, []);

  // CSV Export handler (admin only)
  const handleExportCSV = () => {
    if (role !== "admin") {
      showMessage("Insufficient permissions", "danger");
      return;
    }

    const csvString = generateCSV(items, {});

    // Check if there are any data rows (beyond the header)
    const lines = csvString.split("\n");
    if (lines.length <= 1) {
      showMessage("No results available for export", "info");
      return;
    }

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `auction-results-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mt-3">
      {statusMessage && (
        <div
          className={`alert alert-${statusType} alert-dismissible fade show`}
          role="alert"
        >
          {statusMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setStatusMessage("")}
          ></button>
        </div>
      )}

      <Dashboard />

      <div className="d-flex justify-content-between mb-3">
        <div>
          <button
            className="btn btn-success me-3"
            onClick={handleAddItem}
          >
            Add Item
          </button>
          <button
            className="btn btn-primary me-3"
            onClick={handleUpdateAll}
          >
            Update All
          </button>
          {role === "admin" && (
            <button
              className="btn btn-primary me-3"
              onClick={handleResetAll}
            >
              Reset All
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleUpdateAndResetAll}
          >
            Update & Reset All
          </button>
        </div>
        {role === "admin" && (
          <button
            className="btn btn-outline-secondary"
            onClick={handleExportCSV}
          >
            Export CSV
          </button>
        )}
      </div>

      <Table
        reservePriceInput={ReservePriceInput}
        onReservePriceChange={handleReservePriceChange}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onShowBidders={handleShowBidders}
        items={items}
      />

      <ItemFormModal
        show={showItemForm}
        onHide={() => setShowItemForm(false)}
        item={editItem}
        items={items}
      />

      <BidderListModal
        show={showBidderList}
        onHide={() => setShowBidderList(false)}
        item={bidderListItem}
      />
    </div>
  );
}

export default AdminPage;
