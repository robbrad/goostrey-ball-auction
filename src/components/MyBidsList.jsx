import { useContext } from "react";
import { ItemsContext } from "../contexts/ItemsProvider";
import { AuthContext } from "../contexts/AuthProvider";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";
import { computeUserBids } from "../utils/userBids";

const MyBidsList = () => {
  const { items } = useContext(ItemsContext);
  const { user } = useContext(AuthContext);
  const { openModal } = useContext(ModalsContext);

  const userBids = computeUserBids(items, user?.uid);

  if (userBids.length === 0) {
    return (
      <p className="text-muted text-center mt-4">
        You haven&apos;t placed any bids yet
      </p>
    );
  }

  const handleBidAgain = (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      openModal(ModalTypes.ITEM, item);
    }
  };

  return (
    <ul className="list-group">
      {userBids.map((bid) => {
        const item = items.find((i) => i.id === bid.itemId);
        const isActive = item && item.endTime > new Date();
        const canBidAgain = isActive && bid.standing !== "Winning";

        return (
          <li
            key={bid.itemId}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{bid.title}</strong>
              <br />
              <span className="text-muted">
                Your bid: &pound;{bid.userHighestBid}
              </span>
              {" | "}
              <span className="text-muted">
                Highest: &pound;{bid.currentHighestBid}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {canBidAgain && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleBidAgain(bid.itemId)}
                >
                  Bid Again
                </button>
              )}
              <span
                className={`badge ${
                  bid.standing === "Winning" ? "bg-success" : bid.standing === "Reserve Not Met" ? "bg-warning text-dark" : "bg-danger"
                }`}
              >
                {bid.standing}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MyBidsList;
