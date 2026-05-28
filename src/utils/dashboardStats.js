/**
 * Computes aggregate dashboard statistics from an array of auction items.
 *
 * @param {Array} items - Array of auction item objects
 * @param {number} items[].id - Item identifier
 * @param {string} items[].title - Item title
 * @param {Date} items[].endTime - Auction end time
 * @param {number|null} items[].reservePrice - Reserve price (null if no reserve)
 * @param {Record<number, { amount: number, uid: string }>} items[].bids - Bids keyed by bid number
 * @returns {{ totalItems: number, activeItems: number, endedItems: number, totalBids: number, revenue: number }}
 */
export const computeDashboardStats = (items) => {
  const now = new Date();
  let activeItems = 0;
  let endedItems = 0;
  let totalBids = 0;
  let revenue = 0;

  for (const item of items) {
    const ended = item.endTime <= now;

    if (ended) {
      endedItems++;
    } else {
      activeItems++;
    }

    // Count bids: entries in bids object where key > 0
    const bidKeys = Object.keys(item.bids || {}).filter((k) => Number(k) > 0);
    totalBids += bidKeys.length;

    // Revenue: sum of highest bid for each ended item where reserve is met or no reserve set
    if (ended && bidKeys.length > 0) {
      const highestBid = Math.max(
        ...bidKeys.map((k) => item.bids[k].amount)
      );

      const reserveMet =
        item.reservePrice == null ||
        item.reservePrice <= 0 ||
        highestBid >= item.reservePrice;

      if (reserveMet) {
        revenue += highestBid;
      }
    }
  }

  return {
    totalItems: items.length,
    activeItems,
    endedItems,
    totalBids,
    revenue,
  };
};
