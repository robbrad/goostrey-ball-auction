import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { formatField } from "../utils/formatString";
import { validateItemForm } from "../utils/validation";

/**
 * Computes the next available item ID from the items array.
 * @param {Array} items - Array of item objects with `id` fields
 * @returns {number} The next item ID
 */
const computeNextItemId = (items) => {
  if (!items || items.length === 0) return 1;
  const maxId = Math.max(...items.map((item) => item.id || 0));
  return maxId + 1;
};

/**
 * Modal form for adding or editing auction items.
 * - "Add" mode: item prop is null, fields are empty
 * - "Edit" mode: item prop is an object, fields are pre-populated
 */
const ItemFormModal = ({ show, onHide, item, items }) => {
  const isEditMode = item !== null && item !== undefined;

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    detail: "",
    primaryImage: "",
    secondaryImage: "",
    endTime: "",
    startingPrice: "",
    reservePrice: "",
    currency: "£",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'danger', message: string }

  // Populate form when item changes (edit mode) or reset (add mode)
  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        title: item.title || "",
        subtitle: item.subtitle || "",
        detail: item.detail || "",
        primaryImage: item.primaryImage || "",
        secondaryImage: item.secondaryImage || "",
        endTime: item.endTime
          ? formatDateForInput(item.endTime)
          : "",
        startingPrice:
          item.startingPrice !== undefined && item.startingPrice !== null
            ? String(item.startingPrice)
            : "",
        reservePrice:
          item.reservePrice !== undefined && item.reservePrice !== null
            ? String(item.reservePrice)
            : "",
        currency: item.currency || "£",
      });
      setErrors({});
      setAlert(null);
    } else if (!isEditMode) {
      setFormData({
        title: "",
        subtitle: "",
        detail: "",
        primaryImage: "",
        secondaryImage: "",
        endTime: "",
        startingPrice: "",
        reservePrice: "",
        currency: "£",
      });
      setErrors({});
      setAlert(null);
    }
  }, [item, isEditMode]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    // Clear alert on any change
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation — skip endTime future check in edit mode
    const validation = validateItemForm({
      title: formData.title,
      startingPrice: formData.startingPrice,
      endTime: formData.endTime,
      _skipFutureCheck: isEditMode,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const itemId = isEditMode ? item.id : computeNextItemId(items);
      const fieldKey = formatField(itemId, 0);

      const firestoreData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        detail: formData.detail.trim(),
        primaryImage: formData.primaryImage.trim(),
        secondaryImage: formData.secondaryImage.trim(),
        endTime: Timestamp.fromDate(new Date(formData.endTime)),
        amount: Number(formData.startingPrice),
        currency: formData.currency,
      };

      // Include reservePrice if provided
      if (formData.reservePrice.trim() !== "") {
        firestoreData.reservePrice = Number(formData.reservePrice);
      } else {
        firestoreData.reservePrice = null;
      }

      const docRef = doc(db, "auction", "items");
      await updateDoc(docRef, { [fieldKey]: firestoreData });

      setAlert({
        type: "success",
        message: isEditMode
          ? "Item updated successfully!"
          : "Item added successfully!",
      });

      // Close modal after brief delay on success
      setTimeout(() => {
        onHide();
      }, 1500);
    } catch (error) {
      console.error("Error saving item:", error);
      setAlert({
        type: "danger",
        message: "Failed to save item. Please try again.",
      });
      // Form data is preserved on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onHide();
  };

  return ReactDOM.createPortal(
    <div
      className="modal fade show"
      style={{ display: "block" }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-form-modal-title"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="item-form-modal-title">
              {isEditMode ? "Edit Item" : "Add Item"}
            </h5>
            <button
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            {alert && (
              <div
                className={`alert alert-${alert.type}`}
                role="alert"
              >
                {alert.message}
              </div>
            )}
            <form onSubmit={handleSubmit} id="item-form">
              <div className="mb-3">
                <label htmlFor="item-title" className="form-label">
                  Title *
                </label>
                <input
                  type="text"
                  id="item-title"
                  name="title"
                  className={`form-control${errors.title ? " is-invalid" : ""}`}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter item title"
                />
                {errors.title && (
                  <div className="invalid-feedback">{errors.title}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="item-subtitle" className="form-label">
                  Subtitle
                </label>
                <input
                  type="text"
                  id="item-subtitle"
                  name="subtitle"
                  className="form-control"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="Enter item subtitle"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="item-detail" className="form-label">
                  Detail
                </label>
                <textarea
                  id="item-detail"
                  name="detail"
                  className="form-control"
                  value={formData.detail}
                  onChange={handleChange}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="item-primaryImage" className="form-label">
                    Primary Image
                  </label>
                  <input
                    type="text"
                    id="item-primaryImage"
                    name="primaryImage"
                    className="form-control"
                    value={formData.primaryImage}
                    onChange={handleChange}
                    placeholder="Image filename (without extension)"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="item-secondaryImage" className="form-label">
                    Secondary Image
                  </label>
                  <input
                    type="text"
                    id="item-secondaryImage"
                    name="secondaryImage"
                    className="form-control"
                    value={formData.secondaryImage}
                    onChange={handleChange}
                    placeholder="Image filename (without extension)"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="item-endTime" className="form-label">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  id="item-endTime"
                  name="endTime"
                  className={`form-control${errors.endTime ? " is-invalid" : ""}`}
                  value={formData.endTime}
                  onChange={handleChange}
                />
                {errors.endTime && (
                  <div className="invalid-feedback">{errors.endTime}</div>
                )}
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="item-startingPrice" className="form-label">
                    Starting Price *
                  </label>
                  <input
                    type="number"
                    id="item-startingPrice"
                    name="startingPrice"
                    className={`form-control${errors.startingPrice ? " is-invalid" : ""}`}
                    value={formData.startingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.startingPrice && (
                    <div className="invalid-feedback">
                      {errors.startingPrice}
                    </div>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="item-reservePrice" className="form-label">
                    Reserve Price
                  </label>
                  <input
                    type="number"
                    id="item-reservePrice"
                    name="reservePrice"
                    className="form-control"
                    value={formData.reservePrice}
                    onChange={handleChange}
                    placeholder="0.00 (optional)"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="item-currency" className="form-label">
                    Currency
                  </label>
                  <select
                    id="item-currency"
                    name="currency"
                    className="form-select"
                    value={formData.currency}
                    onChange={handleChange}
                  >
                    <option value="£">£ (GBP)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="item-form"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Formats a Date object to a datetime-local input value string.
 * @param {Date} date
 * @returns {string} ISO-like string for datetime-local input (YYYY-MM-DDTHH:mm)
 */
function formatDateForInput(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

ItemFormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  item: PropTypes.object,
  items: PropTypes.array,
};

ItemFormModal.defaultProps = {
  item: null,
  items: [],
};

export default ItemFormModal;
export { computeNextItemId };
