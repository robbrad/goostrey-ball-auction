/**
 * Returns true if the string is empty or contains only whitespace characters.
 * @param {string} str
 * @returns {boolean}
 */
const isWhitespaceOnly = (str) => {
  return str.trim().length === 0;
};

/**
 * Validates a name (first name or surname).
 * Rules:
 * - Must not be empty or whitespace-only
 * - Must be 2–50 characters (after trimming)
 * - Only letters (Unicode), hyphens, and apostrophes allowed
 * @param {string} name
 * @returns {{ valid: boolean, error: string }}
 */
const validateName = (name) => {
  if (isWhitespaceOnly(name)) {
    return { valid: false, error: "Name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "Name must be no more than 50 characters" };
  }

  // Allow Unicode letters (\p{L}), hyphens, and apostrophes only
  const validPattern = /^[\p{L}\-']+$/u;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Name can only contain letters, hyphens, and apostrophes",
    };
  }

  return { valid: true, error: "" };
};

/**
 * Validates a bid amount.
 * Rules:
 * - Must be a positive numeric value
 * - At most 2 decimal places
 * - No greater than 999,999.99
 * - Must be >= currentHighest + minIncrement
 * @param {string} amount - The bid amount as a string
 * @param {number} currentHighest - The current highest bid
 * @param {number} minIncrement - The minimum bid increment (default £1)
 * @returns {{ valid: boolean, error: string }}
 */
const validateBidAmount = (amount, currentHighest, minIncrement) => {
  const trimmed = amount.trim();

  // Must be a valid numeric format (positive, optional decimal)
  const numericPattern = /^\d+(\.\d{1,2})?$/;
  if (!numericPattern.test(trimmed)) {
    return { valid: false, error: "Please enter a valid monetary amount" };
  }

  const value = parseFloat(trimmed);

  if (value <= 0) {
    return { valid: false, error: "Bid must be a positive amount" };
  }

  if (value > 999999.99) {
    return { valid: false, error: "Bid cannot exceed £999,999.99" };
  }

  const minimumRequired = currentHighest + minIncrement;
  if (value < minimumRequired) {
    return {
      valid: false,
      error: `Bid must be at least £${minimumRequired.toFixed(2)}`,
    };
  }

  return { valid: true, error: "" };
};

/**
 * Validates a reserve price value.
 * Rules:
 * - Must be numeric
 * - Range: 0.00–999,999.99
 * - At most 2 decimal places
 * @param {string} value - The reserve price as a string
 * @returns {{ valid: boolean, error: string }}
 */
const validateReservePrice = (value) => {
  const trimmed = value.trim();

  // Must be a valid numeric format (non-negative, optional decimal up to 2 places)
  const numericPattern = /^\d+(\.\d{1,2})?$/;
  if (!numericPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Reserve price must be a valid number with up to 2 decimal places",
    };
  }

  const numValue = parseFloat(trimmed);

  if (numValue < 0) {
    return { valid: false, error: "Reserve price cannot be negative" };
  }

  if (numValue > 999999.99) {
    return {
      valid: false,
      error: "Reserve price cannot exceed £999,999.99",
    };
  }

  return { valid: true, error: "" };
};

/**
 * Validates an item form data object for creating or editing auction items.
 * Rules:
 * - title must not be empty or whitespace-only
 * - startingPrice must be a non-negative number
 * - endTime must be a valid ISO datetime string representing a future date
 * @param {{ title: string, startingPrice: *, endTime: string }} data
 * @returns {{ valid: boolean, errors: { title?: string, startingPrice?: string, endTime?: string } }}
 */
const validateItemForm = (data) => {
  const errors = {};

  // Validate title: reject empty or whitespace-only
  if (typeof data.title !== "string" || data.title.trim().length === 0) {
    errors.title = "Title is required";
  }

  // Validate startingPrice: must be numeric and non-negative
  const price = Number(data.startingPrice);
  if (
    data.startingPrice === null ||
    data.startingPrice === undefined ||
    data.startingPrice === "" ||
    isNaN(price) ||
    price < 0
  ) {
    errors.startingPrice = "Starting price must be a non-negative number";
  }

  // Validate endTime: must be a valid ISO datetime string in the future
  const endDate = new Date(data.endTime);
  if (
    typeof data.endTime !== "string" ||
    data.endTime.trim().length === 0 ||
    isNaN(endDate.getTime()) ||
    endDate.getTime() <= Date.now()
  ) {
    errors.endTime = "End time must be a valid future date";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export { isWhitespaceOnly, validateName, validateBidAmount, validateReservePrice, validateItemForm };
