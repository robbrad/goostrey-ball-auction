/**
 * Detects items where a user has been outbid between two snapshots.
 *
 * Compares previous and current item states for the given userId.
 * Returns notifications for items where the user lost the highest-bid position.
 *
 * @param {Array} prevItems - Previous snapshot of auction items
 * @param {Array} currItems - Current snapshot of auction items
 * @param {string|null} userId - The user ID to check for outbids
 * @returns {{ id: string, itemTitle: string, newHighestBid: number, currency: string, timestamp: number }[]}
 */
export const detectOutbids = (prevItems, currItems, userId) => {
  if (!userId || !Array.isArray(prevItems) || !Array.isArray(currItems)) {
    return [];
  }

  const notifications = [];

  for (const prevItem of prevItems) {
    if (!prevItem || !prevItem.bids) continue;

    // Get all actual bids (keys > 0)
    const prevBids = Object.entries(prevItem.bids)
      .filter(([key]) => Number(key) > 0)
      .map(([, bid]) => bid);

    if (prevBids.length === 0) continue;

    // Check if user had the highest bid in previous state
    const prevMaxAmount = Math.max(...prevBids.map((b) => b.amount));
    const userHadHighest = prevBids.some(
      (b) => b.uid === userId && b.amount === prevMaxAmount
    );

    if (!userHadHighest) continue;

    // Find the same item in current state
    const currItem = currItems.find((item) => item && item.id === prevItem.id);
    if (!currItem || !currItem.bids) continue;

    // Get current bids
    const currBids = Object.entries(currItem.bids)
      .filter(([key]) => Number(key) > 0)
      .map(([, bid]) => bid);

    if (currBids.length === 0) continue;

    // Check if user still has the highest bid in current state
    const currMaxAmount = Math.max(...currBids.map((b) => b.amount));
    const userStillHighest = currBids.some(
      (b) => b.uid === userId && b.amount === currMaxAmount
    );

    if (!userStillHighest) {
      notifications.push({
        id: `outbid-${prevItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        itemTitle: currItem.title || prevItem.title || "",
        newHighestBid: currMaxAmount,
        currency: currItem.currency || prevItem.currency || "£",
        timestamp: Date.now(),
      });
    }
  }

  return notifications;
};
