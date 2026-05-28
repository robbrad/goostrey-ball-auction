/**
 * Returns the current price for an item: the highest bid amount (max of bids
 * entries with key > 0) or the startingPrice if no bids exist.
 *
 * @param {object} item - Auction item with bids and startingPrice
 * @returns {number}
 */
const getCurrentPrice = (item) => {
  const bidEntries = Object.entries(item.bids || {})
    .filter(([key]) => Number(key) > 0);

  if (bidEntries.length === 0) return item.startingPrice;

  return Math.max(...bidEntries.map(([, bid]) => bid.amount));
};

/**
 * Filters an array of auction items based on the provided filter state.
 * All active filters are applied as an intersection (item must pass ALL filters).
 *
 * Filter rules:
 * - searchText: case-insensitive match on title or subtitle (skipped if empty string)
 * - status: "active" = endTime in the future, "ended" = endTime in the past (skipped if "all")
 * - priceMin/priceMax: range on current highest bid or starting price (skipped if null)
 * - endingSoon: active items with less than 30 minutes remaining (skipped if false)
 *
 * @param {Array} items - Array of auction item objects
 * @param {object} filterState - Filter configuration
 * @param {string} filterState.searchText - Text to search in title/subtitle
 * @param {"all"|"active"|"ended"} filterState.status - Status filter
 * @param {number|null} filterState.priceMin - Minimum price (inclusive)
 * @param {number|null} filterState.priceMax - Maximum price (inclusive)
 * @param {boolean} filterState.endingSoon - Whether to show only ending-soon items
 * @returns {Array} Filtered array of items
 */
export const filterItems = (items, filterState) => {
  const { searchText, status, priceMin, priceMax, endingSoon } = filterState;
  const now = new Date();

  return items.filter((item) => {
    // Text search filter (case-insensitive on title/subtitle)
    if (searchText !== "") {
      const query = searchText.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const subtitle = (item.subtitle || "").toLowerCase();
      if (!title.includes(query) && !subtitle.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (status !== "all") {
      const isActive = item.endTime > now;
      if (status === "active" && !isActive) return false;
      if (status === "ended" && isActive) return false;
    }

    // Price range filter
    const currentPrice = getCurrentPrice(item);
    if (priceMin !== null && currentPrice < priceMin) return false;
    if (priceMax !== null && currentPrice > priceMax) return false;

    // Ending soon filter (active + less than 30 minutes remaining)
    if (endingSoon) {
      const isActive = item.endTime > now;
      if (!isActive) return false;
      const msRemaining = item.endTime.getTime() - now.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      if (msRemaining >= thirtyMinutes) return false;
    }

    return true;
  });
};
