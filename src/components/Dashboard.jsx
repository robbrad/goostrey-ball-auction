import { useContext } from "react";
import { ItemsContext } from "../contexts/ItemsProvider";
import { computeDashboardStats } from "../utils/dashboardStats";

const Dashboard = () => {
  const { items } = useContext(ItemsContext);
  const stats = computeDashboardStats(items);

  const cards = [
    { title: "Total Items", value: stats.totalItems },
    { title: "Active", value: stats.activeItems },
    { title: "Ended", value: stats.endedItems },
    { title: "Total Bids", value: stats.totalBids },
    { title: "Revenue", value: `£${stats.revenue.toFixed(2)}` },
  ];

  return (
    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 mb-4">
      {cards.map((card) => (
        <div className="col" key={card.title}>
          <div className="card h-100 text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">{card.title}</h6>
              <p className="card-text fs-4 fw-bold mb-0">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
