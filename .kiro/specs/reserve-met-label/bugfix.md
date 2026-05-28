# Bugfix Requirements Document

## Introduction

When an auction item has a reserve price set and the current highest bid meets or exceeds that reserve price while the auction is still active, no visual indicator ("Reserve Met" badge) is displayed to users. This leaves bidders unaware that the reserve has been satisfied, reducing confidence in the auction outcome. The fix should introduce a "reserve-met" status and render an appropriate badge in both the Item card and Row components.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an item has a reserve price set AND bids exist AND the highest bid >= reserve price AND the item has not ended THEN the system returns status "active" with no badge displayed

1.2 WHEN `renderStatusBadge()` in Item.jsx receives status "active" THEN the system returns null (no badge rendered)

1.3 WHEN the Row component displays an active item whose reserve has been met THEN the system shows no visual indication that the reserve price has been satisfied

### Expected Behavior (Correct)

2.1 WHEN an item has a reserve price set AND bids exist AND the highest bid >= reserve price AND the item has not ended THEN the system SHALL return status "reserve-met"

2.2 WHEN `renderStatusBadge()` in Item.jsx receives status "reserve-met" THEN the system SHALL render a green "Reserve Met" badge

2.3 WHEN the Row component displays an active item whose reserve has been met THEN the system SHALL display a visual indicator (badge or label) showing that the reserve price has been satisfied

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an item has a reserve price set AND no bids exist THEN the system SHALL CONTINUE TO return status "reserve-not-met"

3.2 WHEN an item has a reserve price set AND the highest bid < reserve price THEN the system SHALL CONTINUE TO return status "reserve-not-met"

3.3 WHEN an item has no reserve price set AND the item has not ended THEN the system SHALL CONTINUE TO return status "active"

3.4 WHEN an item has ended AND bids exist AND reserve is met THEN the system SHALL CONTINUE TO return status "sold"

3.5 WHEN an item has ended AND no bids exist AND no reserve price is set THEN the system SHALL CONTINUE TO return status "ended-no-bids"

3.6 WHEN status is "sold" THEN `renderStatusBadge()` SHALL CONTINUE TO render a green "Sold" badge

3.7 WHEN status is "reserve-not-met" THEN `renderStatusBadge()` SHALL CONTINUE TO render a warning "Reserve Not Met" badge

3.8 WHEN status is "ended-no-bids" THEN `renderStatusBadge()` SHALL CONTINUE TO render a secondary "Item Ended" badge
