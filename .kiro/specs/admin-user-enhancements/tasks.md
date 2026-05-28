# Implementation Plan: Admin & User Enhancements

## Overview

This plan implements 10 enhancements to the Goostrey PTA Ball Auction app: role-based permissions, bidder list modal, item CRUD, auction time management, dashboard, CSV export, My Bids page, outbid notifications, and search/filter. The approach starts with foundational utilities and data model changes, then builds UI components on top, wiring everything together at the end.

## Tasks

- [x] 1. Utility functions and data model foundations
  - [x] 1.1 Create `src/utils/roleResolution.js` with `resolveRole(userDoc)` function
    - Accept a user document object with optional `role` (string) and `admin` (boolean) fields
    - Return "admin" if role is "admin" OR if role is absent and admin is truthy; "editor" if role is "editor"; "" otherwise
    - Export as named export
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 1.2 Write property test for role resolution (Property 2)
    - Create `src/utils/roleResolution.property.test.js`
    - **Property 2: Role resolution from user document**
    - Generate arbitrary user documents with combinations of `role` and `admin` fields
    - Assert the function returns the correct role per the resolution rules
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 2.1, 2.7**

  - [x] 1.3 Create `src/utils/timeExtension.js` with `computeExtendedTime(endTime, minutes)` function
    - Accept a Date object and a number of minutes (5, 15, or 30)
    - Return a new Date equal to endTime plus the exact duration in milliseconds
    - _Requirements: 5.2_

  - [x] 1.4 Write property test for time extension (Property 5)
    - Create `src/utils/timeExtension.property.test.js`
    - **Property 5: Extend time adds exact duration**
    - Generate arbitrary valid dates and durations from {5, 15, 30}
    - Assert new end time equals original plus exact milliseconds
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 5.2**

  - [x] 1.5 Create `src/utils/dashboardStats.js` with `computeDashboardStats(items)` function
    - Accept an array of auction item objects (with bids, endTime, reservePrice)
    - Return `{ totalItems, activeItems, endedItems, totalBids, revenue }`
    - Revenue = sum of highest bid for each ended item where reserve is met or no reserve set
    - _Requirements: 6.1, 6.3_

  - [x] 1.6 Write property test for dashboard stats (Property 6)
    - Create `src/utils/dashboardStats.property.test.js`
    - **Property 6: Dashboard statistics computation**
    - Generate arbitrary arrays of items with varying bids, endTimes, and reserve prices
    - Assert all five stats are computed correctly per the property definition
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 6.1, 6.3**

  - [x] 1.7 Create `src/utils/filterItems.js` with `filterItems(items, filterState)` function
    - Accept items array and filterState `{ searchText, status, priceMin, priceMax, endingSoon }`
    - Apply all active filters as intersection: text search (case-insensitive on title/subtitle), status (active/ended/all), price range on current highest bid or starting price, ending soon (active + <30 min remaining)
    - Return filtered array
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 1.8 Write property test for filter items (Property 10)
    - Create `src/utils/filterItems.property.test.js`
    - **Property 10: Filter items applies combined filters as intersection**
    - Generate arbitrary items arrays and filter states
    - Assert every returned item passes ALL active filters and every excluded item fails at least one
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

  - [x] 1.9 Create `src/utils/validation.js` with `validateItemForm(data)` function
    - Accept an ItemFormData object with title, startingPrice, endTime, etc.
    - Return `{ valid: boolean, errors: { title?, startingPrice?, endTime? } }`
    - Reject if title is empty/whitespace, startingPrice is negative or non-numeric, endTime is not in the future
    - _Requirements: 3.2, 4.2_

  - [x] 1.10 Write property test for item form validation (Property 3)
    - Create `src/utils/validation.property.test.js`
    - **Property 3: Item form validation**
    - Generate arbitrary ItemFormData objects (valid and invalid)
    - Assert deterministic accept/reject based on the three validation conditions
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 3.2, 4.2**

- [x] 2. Bidder list, user bids, outbid detection, and CSV utilities
  - [x] 2.1 Create `src/utils/bidderList.js` with `sortBidders(bids)` function
    - Accept a bids object `Record<number, { amount, uid }>` and return an array sorted descending by amount
    - Each entry contains bidder uid and bid amount
    - _Requirements: 1.2_

  - [x] 2.2 Write property test for bidder list sorting (Property 1)
    - Create `src/utils/bidderList.property.test.js`
    - **Property 1: Bidder list is sorted descending by bid amount**
    - Generate arbitrary bids objects with varying amounts
    - Assert output is in strictly descending order by amount
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 1.2**

  - [x] 2.3 Create `src/utils/userBids.js` with `computeUserBids(items, userId)` function
    - Accept items array and userId string
    - Return array of items where userId has at least one bid, each with: item title, user's highest bid, current highest bid, standing ("Winning" or "Outbid")
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 2.4 Write property test for user bids computation (Property 8)
    - Create `src/utils/userBids.property.test.js`
    - **Property 8: User bids computation with standing**
    - Generate arbitrary items with bids from multiple users
    - Assert correct filtering, highest bid calculation, and standing determination
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 2.5 Create `src/utils/outbidDetection.js` with `detectOutbids(prevItems, currItems, userId)` function
    - Compare previous and current item states for the given userId
    - Return notifications array for items where user lost highest-bid position
    - Return empty array if userId is null or user had no bids in previous state
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 2.6 Write property test for outbid detection (Property 9)
    - Create `src/utils/outbidDetection.property.test.js`
    - **Property 9: Outbid detection**
    - Generate arbitrary previous/current item states and userId
    - Assert notifications are produced exactly when user loses highest-bid position
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 9.1, 9.2, 9.4**

  - [x] 2.7 Create `src/utils/exportCSV.js` with `generateCSV(items, userLookup)` function
    - Accept items array and userLookup map `{ uid: { name, email } }`
    - Return CSV string with header row and one data row per qualifying ended item (winning bid meets reserve or no reserve set)
    - Columns: Item Title, Winning Bid, Winner Name, Winner Email
    - _Requirements: 7.1, 7.2_

  - [x] 2.8 Write property test for CSV export (Property 7)
    - Create `src/utils/exportCSV.property.test.js`
    - **Property 7: CSV export contains only qualifying items with correct columns**
    - Generate arbitrary items and user lookup maps
    - Assert correct row count and column content per the property definition
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 7.1, 7.2**

- [x] 3. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Extend existing `computeEditUpdates` for edit-preserves-bids guarantee
  - [x] 4.1 Write property test for item edit preserves bids (Property 4)
    - Extend `src/firebase/utils.property.test.js`
    - **Property 4: Item edit preserves existing bids**
    - Generate arbitrary items with existing bids and new metadata
    - Assert the updates object never contains bid fields (bid > 0) and only modifies bid-0 metadata
    - Use `{ numRuns: 200 }` configuration
    - **Validates: Requirements 4.3**

- [x] 5. AuthProvider role migration and context update
  - [x] 5.1 Modify `src/contexts/AuthProvider.jsx` to use role-based system
    - Import and use `resolveRole` from `src/utils/roleResolution.js`
    - Read `role` field from user document; fall back to `admin` field for backward compatibility
    - Replace boolean `admin` state with string `role` state
    - Expose `role` in context value instead of `admin`
    - Maintain backward-compatible `admin` getter (role === "admin" || role === "editor") for ProtectedRoute
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 5.2 Update `src/App.jsx` ProtectedRoute to accept role-based access
    - Modify ProtectedRoute to accept a `roles` prop (array of allowed roles)
    - Admin route allows ["admin", "editor"]
    - Add `/my-bids` route for authenticated users
    - _Requirements: 2.2, 2.3, 8.1_

  - [x] 5.3 Update `src/components/Navbar.jsx` for role-aware navigation
    - Show "Admin" link for users with role "admin" or "editor"
    - Show "My Bids" link for all authenticated users
    - _Requirements: 2.3, 8.1_

- [x] 6. ItemsProvider and NotificationsProvider updates
  - [x] 6.1 Modify `src/contexts/ItemsProvider.jsx` to track previous items
    - Store previous items snapshot in a ref before updating state
    - Expose `previousItems` in context value for outbid detection
    - _Requirements: 9.1_

  - [x] 6.2 Create `src/contexts/NotificationsProvider.jsx`
    - Consume ItemsProvider context (items and previousItems) and AuthProvider (user)
    - Call `detectOutbids(previousItems, items, user?.uid)` on items change
    - Maintain notifications array in state
    - Expose `notifications` and `dismiss(id)` in context
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 6.3 Wire NotificationsProvider into `src/App.jsx` provider tree
    - Insert NotificationsProvider between ItemsProvider and ModalsProvider
    - _Requirements: 9.1_

- [x] 7. Checkpoint - Ensure all tests pass after context changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Admin page enhancements (Dashboard, Item CRUD, Time Management, CSV)
  - [x] 8.1 Create `src/components/Dashboard.jsx`
    - Import `computeDashboardStats` and ItemsContext
    - Render stats cards: total items, active, ended, total bids, revenue
    - Use Bootstrap card/grid layout
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Create `src/components/ItemFormModal.jsx`
    - Render a Bootstrap modal with form fields: title, subtitle, detail, primaryImage, secondaryImage, endTime, startingPrice, reservePrice, currency
    - Use `validateItemForm` for client-side validation with inline error messages
    - Support both "Add" mode (empty fields) and "Edit" mode (pre-populated)
    - On submit: compute next item ID (for add) or use existing ID (for edit), write to Firestore
    - Preserve form data on submission failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 8.3 Create `src/components/BidderListModal.jsx`
    - Accept an item prop, use `sortBidders` to order bids
    - Look up bidder names from Firestore `users/{uid}` documents
    - Display each bidder's name and bid amount
    - Show "No bids placed" message when bids object is empty
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 8.4 Modify `src/components/Row.jsx` for new admin actions
    - Add clickable bid count that opens BidderListModal
    - Add Extend buttons (5m, 15m, 30m) using `computeExtendedTime` and Firestore update
    - Add "Close Now" button that sets endTime to current timestamp
    - Add "Edit" button that opens ItemFormModal in edit mode
    - Conditionally show/hide Delete button based on role (admin only)
    - _Requirements: 1.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.5 Modify `src/pages/Admin.jsx` with Dashboard, Add Item, and CSV Export
    - Add Dashboard component at top of page
    - Add "Add Item" button that opens ItemFormModal in add mode
    - Add "Export CSV" button (admin only) that calls `generateCSV`, creates Blob, triggers download
    - Hide "Reset All" button for editors (role !== "admin")
    - Show "Insufficient permissions" toast if editor attempts restricted action
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 6.1, 7.1, 7.2, 7.3, 7.4_

- [x] 9. User-facing features (My Bids, Notifications, Filter)
  - [x] 9.1 Create `src/components/FilterPanel.jsx`
    - Render search text input, status dropdown (all/active/ended), price min/max inputs, ending-soon toggle
    - Call parent onChange callback with updated FilterState on any control change
    - _Requirements: 10.1_

  - [x] 9.2 Modify `src/pages/Home.jsx` to integrate FilterPanel with Grid
    - Add FilterPanel above Grid
    - Maintain filterState in local state
    - Pass `filterItems(items, filterState)` result to Grid as filtered items
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 9.3 Modify `src/components/Grid.jsx` to accept items prop
    - Accept optional `items` prop; fall back to context items if not provided
    - Render the provided items array
    - _Requirements: 10.6_

  - [x] 9.4 Create `src/components/MyBidsList.jsx`
    - Import `computeUserBids` and consume ItemsContext and AuthContext
    - Render list of items with: title, user's highest bid, current highest bid, standing badge ("Winning" green / "Outbid" red)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.5 Create `src/pages/MyBids.jsx` page component
    - Render MyBidsList component
    - Redirect unauthenticated users to home
    - _Requirements: 8.1, 8.5_

  - [x] 9.6 Create `src/components/ToastNotification.jsx`
    - Consume NotificationsProvider context
    - Render Bootstrap toast for each notification showing item title and new highest bid
    - Auto-dismiss after 5 seconds; allow manual dismiss
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.7 Wire ToastNotification into App layout
    - Render ToastNotification component inside the NotificationsProvider scope in App.jsx
    - _Requirements: 9.1_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `computeEditUpdates` function already handles the edit-preserves-bids logic; Property 4 test validates this existing behavior
- All utility functions are pure and testable without Firebase mocks
- The role migration is backward-compatible: existing users with boolean `admin: true` will be treated as role "admin"

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5", "1.7", "1.9", "2.1", "2.3", "2.5", "2.7"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6", "1.8", "1.10", "2.2", "2.4", "2.6", "2.8", "4.1"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "9.1", "9.3", "9.4"] },
    { "id": 6, "tasks": ["8.4", "8.5", "9.2", "9.5", "9.6"] },
    { "id": 7, "tasks": ["9.7"] }
  ]
}
```
