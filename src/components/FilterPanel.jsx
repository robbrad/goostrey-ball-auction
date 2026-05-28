/**
 * FilterPanel component for searching and filtering auction items.
 * Renders controls for text search, status dropdown, price range, and ending-soon toggle.
 * Uses Bootstrap form controls with responsive layout (horizontal on desktop, stacked on mobile).
 *
 * @param {object} props
 * @param {object} props.filterState - Current filter state
 * @param {string} props.filterState.searchText - Text to search in title/subtitle
 * @param {"all"|"active"|"ended"} props.filterState.status - Status filter
 * @param {number|null} props.filterState.priceMin - Minimum price (inclusive)
 * @param {number|null} props.filterState.priceMax - Maximum price (inclusive)
 * @param {boolean} props.filterState.endingSoon - Whether to show only ending-soon items
 * @param {function} props.onChange - Callback with updated FilterState on any control change
 */
const FilterPanel = ({ filterState, onChange }) => {
  const handleSearchChange = (e) => {
    onChange({ ...filterState, searchText: e.target.value });
  };

  const handleStatusChange = (e) => {
    onChange({ ...filterState, status: e.target.value });
  };

  const handlePriceMinChange = (e) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    onChange({ ...filterState, priceMin: value });
  };

  const handlePriceMaxChange = (e) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    onChange({ ...filterState, priceMax: value });
  };

  const handleEndingSoonChange = (e) => {
    onChange({ ...filterState, endingSoon: e.target.checked });
  };

  return (
    <div className="row g-2 mb-3 align-items-end">
      <div className="col-12 col-md">
        <label htmlFor="filter-search" className="form-label mb-1">
          Search
        </label>
        <input
          id="filter-search"
          type="text"
          className="form-control"
          placeholder="Search items..."
          value={filterState.searchText}
          onChange={handleSearchChange}
        />
      </div>

      <div className="col-12 col-md-auto">
        <label htmlFor="filter-status" className="form-label mb-1">
          Status
        </label>
        <select
          id="filter-status"
          className="form-select"
          value={filterState.status}
          onChange={handleStatusChange}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      <div className="col-6 col-md-auto">
        <label htmlFor="filter-price-min" className="form-label mb-1">
          Min £
        </label>
        <input
          id="filter-price-min"
          type="number"
          className="form-control"
          placeholder="Min"
          value={filterState.priceMin ?? ""}
          onChange={handlePriceMinChange}
          min="0"
        />
      </div>

      <div className="col-6 col-md-auto">
        <label htmlFor="filter-price-max" className="form-label mb-1">
          Max £
        </label>
        <input
          id="filter-price-max"
          type="number"
          className="form-control"
          placeholder="Max"
          value={filterState.priceMax ?? ""}
          onChange={handlePriceMaxChange}
          min="0"
        />
      </div>

      <div className="col-12 col-md-auto d-flex align-items-end">
        <div className="form-check mb-1">
          <input
            id="filter-ending-soon"
            type="checkbox"
            className="form-check-input"
            checked={filterState.endingSoon}
            onChange={handleEndingSoonChange}
          />
          <label htmlFor="filter-ending-soon" className="form-check-label">
            Ending soon
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
