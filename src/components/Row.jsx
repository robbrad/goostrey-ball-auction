import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { formatTime, formatMoney } from "../utils/formatString";
import { itemStatus } from "../utils/itemStatus";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { editItems } from "../firebase/utils";

export const Row = ({ item, reservePriceInput: ReservePriceInputComponent, onReservePriceChange, onDelete }) => {
  const [amount, setAmount] = useState(item.startingPrice);
  const [bids, setBids] = useState(0);
  const [winner, setWinner] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const status = itemStatus(item);
    setAmount(formatMoney(item.currency, status.amount));
    setBids(status.bids);
    if (status.winner) {
      getDoc(doc(db, "users", status.winner)).then((user) => {
        setWinner(user.get("name"));
      });
    } else {
      setWinner("");
    }
  }, [item]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = item.endTime - now;

      if (remaining > 0) {
        setTimeLeft(formatTime(remaining));
        requestAnimationFrame(updateTimer);
      } else {
        setTimeLeft("Item Ended");
      }
    };

    requestAnimationFrame(updateTimer);
  }, [item.endTime]);

  const reservePriceDisplay = item.reservePrice != null && item.reservePrice > 0
    ? formatMoney(item.currency, item.reservePrice)
    : "—";

  return (
    <tr>
      <td>{item.id}</td>
      <td>{item.title}</td>
      <td>{amount}</td>
      <td>
        {ReservePriceInputComponent && onReservePriceChange ? (
          <ReservePriceInputComponent
            value={item.reservePrice != null ? String(item.reservePrice) : ""}
            onChange={onReservePriceChange}
            itemId={item.id}
          />
        ) : (
          reservePriceDisplay
        )}
      </td>
      <td>{bids}</td>
      <td>{winner}</td>
      <td>{timeLeft}</td>
      <td>
        <button
          className="btn btn-primary me-3"
          onClick={() => editItems(item.id, true, false)}
        >
          Update
        </button>
        <button
          className="btn btn-primary me-3"
          onClick={() => editItems(item.id, false, true)}
        >
          Reset
        </button>
        <button
          className="btn btn-primary"
          onClick={() => editItems(item.id, true, true)}
        >
          Update & Reset
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm("Are you sure?")) {
              onDelete(item.id);
            }
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

Row.propTypes = {
  item: PropTypes.shape({
    startingPrice: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    endTime: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    reservePrice: PropTypes.number,
  }),
  reservePriceInput: PropTypes.elementType,
  onReservePriceChange: PropTypes.func,
  onDelete: PropTypes.func,
};
