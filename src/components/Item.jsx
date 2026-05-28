import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { itemStatus } from "../utils/itemStatus";
import { formatTime, formatMoney } from "../utils/formatString";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";
import { useAuth } from "../contexts/AuthProvider";

export const Item = ({ item }) => {
  const { openModal } = useContext(ModalsContext);
  const { admin } = useAuth();

  const [primaryImageSrc, setPrimaryImageSrc] = useState("");
  const [bids, setBids] = useState(0);
  const [amount, setAmount] = useState(item.startingPrice);
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    const result = itemStatus(item);
    setBids(result.bids);
    setAmount(formatMoney(item.currency, result.amount));
    setStatus(result.status);
  }, [item]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = item.endTime - now;

      if (remaining > 0) {
        setTimeLeft(formatTime(remaining));
      } else {
        setTimeLeft("Item Ended");
      }
    };

    // Run immediately, then every second
    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [item.endTime]);

  useEffect(() => {
    import(`../assets/${item.primaryImage}.png`).then((src) => {
      setPrimaryImageSrc(src.default)
    })
  }, [item.primaryImage])

  const renderStatusBadge = () => {
    switch (status) {
      case "sold":
        return <span className="badge bg-success">Sold</span>;
      case "reserve-not-met":
        return <span className="badge bg-warning text-dark">Reserve Not Met</span>;
      case "ended-no-bids":
        return <span className="badge bg-secondary">Item Ended</span>;
      default:
        return null;
    }
  };

  return (
    <div className="col">
      <div className="card h-100" onClick={() => openModal(ModalTypes.ITEM, item)}>
        <img
          src={primaryImageSrc}
          className="card-img-top"
          alt={item.title}
        />
        <div className="card-body">
          <h5 className="title">{item.title}</h5>
          <h6 className="card-subtitle mb-2 text-body-secondary">{item.subtitle}</h6>
          {renderStatusBadge()}
        </div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item"><strong>{amount}</strong></li>
          <li className="list-group-item">
            {bids} bids · {status === "active" ? timeLeft : "Item Ended"}
          </li>
          {admin && item.reservePrice != null && item.reservePrice > 0 && (
            <li className="list-group-item text-muted">
              Reserve: {formatMoney(item.currency, item.reservePrice)}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

Item.propTypes = {
  item: PropTypes.shape({
    startingPrice: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    endTime: PropTypes.object.isRequired,
    primaryImage: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
  })
}
