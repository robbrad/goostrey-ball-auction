/**
 * Computes the list of items a user has bid on, with their standing.
 *
 * @param {Array<{ id: number, title: string, bids: Record<number, { amount: number, uid: string }>, reservePrice: number|null, endTime: Date }>} items - Array of auction items
 * @param {string} userId - The user's UID
 * @returns {{ title: string, userHighestBid: number, currentHighestBid: number, standing: "Winning" | "Outbid" | "Reserve Not Met", itemId: number }[]}
 */
export const computeUserBids = (items, userId) => {
  if (!items || !userId) return [];

  const results = [];

  for (const item of items) {
    const bids = item.bids;
    if (!bids || typeof bids !== "object") continue;

    const allBids = Object.entries(bids)
      .filter(([key]) => Number(key) > 0)
      .map(([, bid]) => bid);

    const userBids = allBids.filter((bid) => bid.uid === userId);
    if (userBids.length === 0) continue;

    const userHighestBid = Math.max(...userBids.map((b) => b.amount));
    const currentHighestBid = Math.max(...allBids.map((b) => b.amount));

    // Check if reserve price is not met
    let standing;
    if (item.reservePrice != null && item.reservePrice > 0 && currentHighestBid < item.reservePrice) {
      standing = "Reserve Not Met";
    } else if (userHighestBid === currentHighestBid) {
      standing = "Winning";
    } else {
      standing = "Outbid";
    }

    results.push({
      title: item.title,
      userHighestBid,
      currentHighestBid,
      standing,
      itemId: item.id,
    });
  }

  return results;
};
