/**
 * Generates a CSV string of auction results for qualifying ended items.
 *
 * A qualifying item:
 * - Has ended (endTime is in the past)
 * - Has at least one actual bid (key > 0)
 * - Winning bid meets or exceeds reservePrice, OR reservePrice is null
 *
 * @param {Array<{ id: number, title: string, endTime: Date, reservePrice: number|null, bids: Record<number, { amount: number, uid: string }> }>} items - Auction items array
 * @param {Record<string, { name: string, email: string }>} userLookup - Map of uid to user info
 * @returns {string} CSV string with header and data rows
 */
export const generateCSV = (items, userLookup) => {
  if (!items || !Array.isArray(items)) return "Item Title,Winning Bid,Winner Name,Winner Email";

  const now = new Date();
  const header = "Item Title,Winning Bid,Winner Name,Winner Email";
  const rows = [];

  for (const item of items) {
    // Must have ended
    if (!item.endTime || item.endTime >= now) continue;

    // Get actual bids (keys > 0)
    const actualBids = Object.entries(item.bids || {})
      .filter(([key]) => Number(key) > 0)
      .map(([, bid]) => bid);

    // Must have at least one actual bid
    if (actualBids.length === 0) continue;

    // Find winning bid (highest amount)
    const winningBid = actualBids.reduce(
      (max, bid) => (bid.amount > max.amount ? bid : max),
      actualBids[0]
    );

    // Check reserve price condition
    if (item.reservePrice != null && winningBid.amount < item.reservePrice) continue;

    // Look up winner info
    const winner = userLookup && userLookup[winningBid.uid];
    const winnerName = winner ? winner.name : "Unknown";
    const winnerEmail = winner ? winner.email : "Unknown";

    // Build CSV row, quoting values that contain commas
    const row = [
      quoteIfNeeded(item.title || ""),
      winningBid.amount,
      quoteIfNeeded(winnerName),
      quoteIfNeeded(winnerEmail),
    ].join(",");

    rows.push(row);
  }

  return [header, ...rows].join("\n");
};

/**
 * Wraps a value in double quotes if it contains a comma.
 * @param {string} value
 * @returns {string}
 */
function quoteIfNeeded(value) {
  const str = String(value);
  if (str.includes(",")) {
    return `"${str}"`;
  }
  return str;
}
