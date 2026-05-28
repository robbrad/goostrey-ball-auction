export const itemStatus = (item) => {
  const bids = Object.keys(item.bids ?? {}).length;
  const amount = bids ? item.bids[bids].amount : item.startingPrice ?? 0;
  const winner = bids ? item.bids[bids].uid : "";
  const ended = item.endTime ? new Date(item.endTime) <= new Date() : false;

  let status;
  if (!ended) {
    status = "active";
  } else if (bids === 0) {
    if (item.reservePrice != null && item.reservePrice > 0) {
      status = "reserve-not-met";
    } else {
      status = "ended-no-bids";
    }
  } else if (item.reservePrice != null && item.reservePrice > 0 && amount < item.reservePrice) {
    status = "reserve-not-met";
  } else {
    status = "sold";
  }

  return { bids, amount, winner, ended, status };
};
