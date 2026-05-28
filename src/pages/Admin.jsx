import { useState, useContext, useCallback } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { editItems, deleteItem } from "../firebase/utils";
import { formatField } from "../utils/formatString";
import { ItemsContext } from "../contexts/ItemsProvider";
import Table from "../components/Table";
import { ReservePriceInput } from "../components/ReservePriceInput";

function AdminPage() {
  const { items } = useContext(ItemsContext);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("success"); // "success" or "danger"

  const showMessage = (message, type = "success") => {
    setStatusMessage(message);
    setStatusType(type);
    // Auto-clear after 5 seconds
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
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-primary me-3"
          onClick={handleUpdateAll}
        >
          Update All
        </button>
        <button
          className="btn btn-primary me-3"
          onClick={handleResetAll}
        >
          Reset All
        </button>
        <button
          className="btn btn-primary"
          onClick={handleUpdateAndResetAll}
        >
          Update & Reset All
        </button>
      </div>
      <Table
        reservePriceInput={ReservePriceInput}
        onReservePriceChange={handleReservePriceChange}
        onDelete={handleDelete}
        items={items}
      />
    </div>
  );
}

export default AdminPage;
