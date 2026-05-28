/**
 * Sorts bidders from a bids object in descending order by bid amount.
 *
 * @param {Record<number, { amount: number, uid: string }>} bids - Bids object where key 0 is item metadata (skipped) and keys > 0 are actual bids
 * @returns {{ uid: string, amount: number }[]} Array of bidders sorted descending by amount
 */
export const sortBidders = (bids) => {
  if (!bids || typeof bids !== "object") return [];

  return Object.entries(bids)
    .filter(([key]) => Number(key) > 0)
    .map(([, bid]) => ({ uid: bid.uid, amount: bid.amount }))
    .sort((a, b) => b.amount - a.amount);
};
