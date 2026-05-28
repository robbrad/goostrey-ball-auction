import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { formatTime, formatMoney, formatField } from "../utils/formatString";
import { itemStatus } from "../utils/itemStatus";
import { getDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { editItems } from "../firebase/utils";
import { useAuth } from "../contexts/AuthProvider";
import { computeExtendedTime } from "../utils/timeExtension";

export const Row = ({ item, reservePriceInput: ReservePriceInputComponent, onReservePriceChange, onDelete, onEdit, onShowBidders }) => {
  const [amount, setAmount] = useState(item.startingPrice);
  const [bids, setBids] = useState(0);
  const [winner, setWinner] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const { role } = useAuth();

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
    let rafId;
    const updateTimer = () => {
      const now = Date.now();
      const remaining = item.endTime - now;

      if (remaining > 0) {
        setTimeLeft(formatTime(remaining));
        rafId = requestAnimationFrame(updateTimer);
      } else {
        setTimeLeft("Item Ended");
      }
    };

    updateTimer();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [item.endTime]);

  const handleExtend = async (minutes) => {
    try {
      const currentEndTime = item.endTime instanceof Date ? item.endTime : new Date(item.endTime);
      const newEndTime = computeExtendedTime(currentEndTime, minutes);
      const fieldKey = formatField(item.id, 0);
      const docRef = doc(db, "auction", "items");
      await updateDoc(docRef, {
        [`${fieldKey}.endTime`]: Timestamp.fromDate(newEndTime),
      });
    } catch (error) {
      console.error("Failed to extend time:", error);
      alert("Failed to extend time. Please try again.");
    }
  };

  const handleCloseNow = async () => {
    try {
      const fieldKey = formatField(item.id, 0);
      const docRef = doc(db, "auction", "items");
      await updateDoc(docRef, {
        [`${fieldKey}.endTime`]: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Failed to close item:", error);
      alert("Failed to close item. Please try again.");
    }
  };

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
      <td>
        <button
          className="btn btn-link p-0"
          onClick={() => onShowBidders && onShowBidders(item)}
          title="View bidders"
        >
          {bids}
        </button>
      </td>
      <td>{winner}</td>
      <td>{timeLeft}</td>
      <td>
        <div className="d-flex flex-wrap gap-1">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => editItems(item.id, true, false)}
          >
            Update
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => editItems(item.id, false, true)}
          >
            Reset
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => editItems(item.id, true, true)}
          >
            Update &amp; Reset
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleExtend(5)}
            title="Extend 5 minutes"
          >
            +5m
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleExtend(15)}
            title="Extend 15 minutes"
          >
            +15m
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleExtend(30)}
            title="Extend 30 minutes"
          >
            +30m
          </button>
          <button
            className="btn btn-warning btn-sm"
            onClick={handleCloseNow}
          >
            Close Now
          </button>
          <button
            className="btn btn-info btn-sm"
            onClick={() => onEdit && onEdit(item)}
          >
            Edit
          </button>
          {role === "admin" && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm("Are you sure?")) {
                  onDelete(item.id);
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
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
    bids: PropTypes.object,
  }),
  reservePriceInput: PropTypes.elementType,
  onReservePriceChange: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onShowBidders: PropTypes.func,
};
