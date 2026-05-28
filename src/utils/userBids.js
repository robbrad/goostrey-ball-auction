/**
 * Computes the list of items a user has bid on, with their standing.
 *
 * @param {Array<{ id: number, title: string, bids: Record<number, { amount: number, uid: string }> }>} items - Array of auction items
 * @param {string} userId - The user's UID
 * @returns {{ title: string, userHighestBid: number, currentHighestBid: number, standing: "Winning" | "Outbid", itemId: number }[]}
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
    const standing = userHighestBid === currentHighestBid ? "Winning" : "Outbid";

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
