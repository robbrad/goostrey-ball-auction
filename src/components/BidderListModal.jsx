import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { sortBidders } from "../utils/bidderList";
import { formatMoney } from "../utils/formatString";

const BidderListModal = ({ show, onHide, item }) => {
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !item) {
      setBidders([]);
      return;
    }

    const sorted = sortBidders(item.bids);

    if (sorted.length === 0) {
      setBidders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get unique uids to avoid duplicate fetches
    const uniqueUids = [...new Set(sorted.map((b) => b.uid))];

    Promise.all(
      uniqueUids.map((uid) =>
        getDoc(doc(db, "users", uid))
          .then((snap) => ({
            uid,
            name: snap.exists() ? snap.get("name") || "Unknown" : "Unknown",
          }))
          .catch(() => ({ uid, name: "Unknown" }))
      )
    ).then((users) => {
      const nameMap = Object.fromEntries(users.map((u) => [u.uid, u.name]));
      setBidders(sorted.map((b) => ({ ...b, name: nameMap[b.uid] })));
      setLoading(false);
    });
  }, [show, item]);

  if (!show) return null;

  const hasBids = item && sortBidders(item.bids).length > 0;

  return ReactDOM.createPortal(
    <div
      className="modal fade show"
      style={{ display: "block" }}
      onClick={onHide}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Bidders {item ? `- ${item.title}` : ""}
            </h5>
            <button className="btn-close" onClick={onHide} />
          </div>
          <div className="modal-body">
            {loading && <p>Loading bidders...</p>}
            {!loading && !hasBids && <p>No bids placed</p>}
            {!loading && hasBids && (
              <ul className="list-group">
                {bidders.map((bidder, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{bidder.name}</span>
                    <span className="badge bg-primary rounded-pill">
                      {item ? formatMoney(item.currency, bidder.amount) : `£${bidder.amount}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

BidderListModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  item: PropTypes.object,
};

export default BidderListModal;
