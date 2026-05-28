import { useState, useContext } from "react";
import Grid from "../components/Grid";
import FilterPanel from "../components/FilterPanel";
import { ItemModal } from "../components/Modal";
import { ItemsContext } from "../contexts/ItemsProvider";
import { filterItems } from "../utils/filterItems";

function HomePage() {
  const { items } = useContext(ItemsContext);
  const [filterState, setFilterState] = useState({
    searchText: "",
    status: "all",
    priceMin: null,
    priceMax: null,
    endingSoon: false,
  });

  const filteredItems = filterItems(items, filterState);

  return (
    <div className="container mt-3">
      <FilterPanel filterState={filterState} onChange={setFilterState} />
      <Grid items={filteredItems} />
      <ItemModal />
    </div>
  );
}

export default HomePage;
