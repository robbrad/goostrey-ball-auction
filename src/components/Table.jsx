import { useContext } from "react";
import PropTypes from "prop-types";
import { Row } from "./Row";
import { ItemsContext } from "../contexts/ItemsProvider";

const Table = ({ reservePriceInput: ReservePriceInputComponent, onReservePriceChange, onDelete, onEdit, onShowBidders, items: propItems }) => {
  const { items: contextItems } = useContext(ItemsContext);
  const items = propItems || contextItems;

  return (
    <table className="table table-striped">
    <thead>
    <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Price</th>
        <th>Reserve Price</th>
        <th>Bids</th>
        <th>Winner</th>
        <th>Time Left</th>
        <th>Actions</th>
    </tr>
    </thead>
    <tbody>
    {items.map((item) => (
        <Row
          key={item.id}
          item={item}
          reservePriceInput={ReservePriceInputComponent}
          onReservePriceChange={onReservePriceChange}
          onDelete={onDelete}
          onEdit={onEdit}
          onShowBidders={onShowBidders}
        />
    ))}
    </tbody>
    </table>
  );
};

Table.propTypes = {
  reservePriceInput: PropTypes.elementType,
  onReservePriceChange: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onShowBidders: PropTypes.func,
  items: PropTypes.array,
};

export default Table;
