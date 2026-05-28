import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { validateReservePrice } from "../utils/validation";

/**
 * Controlled input component for setting a reserve price on an auction item.
 * Validates input on change and blur using validateReservePrice.
 * Accepts 0.00 as a valid value meaning "no reserve".
 */
export const ReservePriceInput = ({ value, onChange, itemId }) => {
  const [inputValue, setInputValue] = useState(value ?? "");
  const [error, setError] = useState("");

  // Sync local state when the external value prop changes
  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear error while typing if field is empty
    if (newValue.trim() === "") {
      setError("");
      return;
    }

    const result = validateReservePrice(newValue);
    if (!result.valid) {
      setError(result.error);
    } else {
      setError("");
    }
  };

  const handleBlur = () => {
    // Allow empty field (means no reserve set)
    if (inputValue.trim() === "") {
      setError("");
      onChange(itemId, "");
      return;
    }

    const result = validateReservePrice(inputValue);
    if (result.valid) {
      setError("");
      onChange(itemId, inputValue.trim());
    } else {
      setError(result.error);
    }
  };

  const inputId = `reserve-price-${itemId}`;

  return (
    <div className="reserve-price-input">
      <input
        type="text"
        id={inputId}
        className={`form-control form-control-sm${error ? " is-invalid" : ""}`}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="0.00"
        aria-label={`Reserve price for item ${itemId}`}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <div id={`${inputId}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
};

ReservePriceInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
