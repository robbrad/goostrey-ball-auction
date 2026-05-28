import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import MyBidsList from "../components/MyBidsList";

const MyBidsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mt-4">
      <h2>My Bids</h2>
      <MyBidsList />
    </div>
  );
};

export default MyBidsPage;
