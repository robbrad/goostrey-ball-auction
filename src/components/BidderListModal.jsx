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
            firstName: snap.exists() ? snap.get("firstName") || "" : "",
            surname: snap.exists() ? snap.get("surname") || "" : "",
            email: snap.exists() ? snap.get("email") || "" : "",
          }))
          .catch(() => ({ uid, firstName: "Unknown", surname: "", email: "" }))
      )
    ).then((users) => {
      const userMap = Object.fromEntries(users.map((u) => [u.uid, u]));
      setBidders(sorted.map((b) => ({ ...b, ...userMap[b.uid] })));
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
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
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
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>First Name</th>
                      <th>Surname</th>
                      <th>Email</th>
                      <th className="text-end">Bid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidders.map((bidder, index) => (
                      <tr key={index}>
                        <td>{bidder.firstName || "Unknown"}</td>
                        <td>{bidder.surname || ""}</td>
                        <td>{bidder.email || ""}</td>
                        <td className="text-end">
                          <span className="badge bg-primary rounded-pill">
                            {item ? formatMoney(item.currency, bidder.amount) : `£${bidder.amount}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
