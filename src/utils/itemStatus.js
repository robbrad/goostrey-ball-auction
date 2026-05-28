export const itemStatus = (item) => {
  const bids = Object.keys(item.bids ?? {}).length;
  const amount = bids ? item.bids[bids].amount : item.startingPrice ?? 0;
  const winner = bids ? item.bids[bids].uid : "";
  const ended = item.endTime ? new Date(item.endTime) <= new Date() : false;

  let status;
  // Check reserve not met: applies regardless of end date
  // Reserve is not met if: reserve is set AND (no bids exist OR highest bid < reserve)
  if (item.reservePrice != null && item.reservePrice > 0) {
    if (bids === 0 || amount < item.reservePrice) {
      status = "reserve-not-met";
    } else if (!ended) {
      status = "active";
    } else {
      status = "sold";
    }
  } else if (!ended) {
    status = "active";
  } else if (bids === 0) {
    status = "ended-no-bids";
  } else {
    status = "sold";
  }

  return { bids, amount, winner, ended, status };
};
