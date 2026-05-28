import { useContext } from "react";
import { ItemsContext } from "../contexts/ItemsProvider";
import { AuthContext } from "../contexts/AuthProvider";
import { computeUserBids } from "../utils/userBids";

const MyBidsList = () => {
  const { items } = useContext(ItemsContext);
  const { user } = useContext(AuthContext);

  const userBids = computeUserBids(items, user?.uid);

  if (userBids.length === 0) {
    return (
      <p className="text-muted text-center mt-4">
        You haven&apos;t placed any bids yet
      </p>
    );
  }

  return (
    <ul className="list-group">
      {userBids.map((bid) => (
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
          <span
            className={`badge ${
              bid.standing === "Winning" ? "bg-success" : bid.standing === "Reserve Not Met" ? "bg-warning text-dark" : "bg-danger"
            }`}
          >
            {bid.standing}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default MyBidsList;
