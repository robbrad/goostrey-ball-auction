# Requirements Document

## Introduction

This feature set enhances the Goostrey PTA Ball Auction application with comprehensive admin tooling and user-facing improvements. Admin enhancements include role-based access control (Super Admin vs Editor), a bidder list modal, item CRUD from the UI, auction time management, a dashboard summary, and CSV export. User enhancements include a "My Bids" page, outbid notifications, and search/filter capabilities.

## Glossary

- **Auction_App**: The Goostrey PTA Ball Auction React SPA
- **Admin_Table**: The table on the admin page displaying all auction items with their status
- **Bidder_List_Modal**: A modal dialog showing all bidders for a specific auction item
- **Super_Admin**: A user with role "admin" who has full access to all administrative functions
- **Editor**: A user with role "editor" who can manage items and view bids but cannot perform destructive or user-management operations
- **Role_Field**: The `role` field in the Firestore user document (`users/{uid}`) storing one of "admin", "editor", or ""
- **Item_Form**: A UI form for creating or editing auction items
- **Dashboard**: A summary panel showing aggregate auction statistics
- **CSV_Export**: A downloadable file containing auction results in comma-separated format
- **My_Bids_Page**: A user-facing page showing all items the current user has bid on
- **Toast_Notification**: A non-blocking UI notification that appears temporarily to inform the user
- **Filter_Panel**: UI controls allowing users to filter and search auction items
- **Firestore_Items_Doc**: The single Firestore document at `auction/items` containing all item and bid data

## Requirements

### Requirement 1: Clickable Bid Count with Bidder List

**User Story:** As an admin or editor, I want to click the bid count in the admin table to see all bidders for that item, so that I can review bidding activity at a glance.

#### Acceptance Criteria

1. WHEN a Super_Admin or Editor clicks the bid count cell for an item in the Admin_Table, THE Auction_App SHALL display the Bidder_List_Modal for that item
2. THE Bidder_List_Modal SHALL display each bidder's name, bid amount, and timestamp (if available) in descending order by bid amount
3. IF no bids exist for the selected item, THEN THE Bidder_List_Modal SHALL display a message indicating no bids have been placed
4. WHEN the user closes the Bidder_List_Modal, THE Auction_App SHALL return focus to the Admin_Table

### Requirement 2: Role-Based Permissions

**User Story:** As a system owner, I want two distinct admin roles so that I can delegate item management to editors without granting them destructive capabilities.

#### Acceptance Criteria

1. THE Auction_App SHALL recognise three role values in the Role_Field: "admin" (Super_Admin), "editor" (Editor), and "" (regular user)
2. WHILE a user has the Role_Field set to "admin", THE Auction_App SHALL grant access to all administrative functions including Update All, Reset All, Delete items, and user/role management
3. WHILE a user has the Role_Field set to "editor", THE Auction_App SHALL grant access to add items, edit items, set reserve prices, and view bids
4. WHILE a user has the Role_Field set to "editor", THE Auction_App SHALL hide the Reset All button, Delete button, and user management controls
5. IF a user with the "editor" role attempts to access a restricted function via URL manipulation or API call, THEN THE Auction_App SHALL deny the action and display an "insufficient permissions" message
6. WHEN the AuthProvider loads a user session, THE Auction_App SHALL read the Role_Field from the Firestore user document and expose the role value in the auth context
7. THE Auction_App SHALL migrate the existing boolean `admin` field to the new Role_Field by treating any truthy `admin` value as equivalent to role "admin"

### Requirement 3: Add Item from UI

**User Story:** As an admin or editor, I want to create new auction items directly from the UI, so that I do not need to edit YAML files for day-to-day management.

#### Acceptance Criteria

1. WHEN a Super_Admin or Editor clicks the "Add Item" button, THE Auction_App SHALL display the Item_Form with empty fields for title, subtitle, detail, images, end time, starting price, and reserve price
2. THE Item_Form SHALL validate that title is non-empty, starting price is a non-negative number, and end time is a future date/time before allowing submission
3. WHEN the user submits a valid Item_Form, THE Auction_App SHALL write the new item to the Firestore_Items_Doc using the next available item ID
4. IF the Item_Form submission fails, THEN THE Auction_App SHALL display an error message and preserve the entered form data
5. WHEN a new item is successfully created, THE Auction_App SHALL display a success confirmation message

### Requirement 4: Item Edit Page

**User Story:** As an admin or editor, I want to edit existing auction items from the UI, so that I can make corrections without relying on YAML file updates.

#### Acceptance Criteria

1. WHEN a Super_Admin or Editor clicks an "Edit" button for an item in the Admin_Table, THE Auction_App SHALL display the Item_Form pre-populated with the item's current values (title, subtitle, detail, end time, starting price, reserve price)
2. THE Item_Form SHALL validate edited fields using the same rules as item creation before allowing submission
3. WHEN the user submits a valid edited Item_Form, THE Auction_App SHALL update the corresponding item fields in the Firestore_Items_Doc while preserving all existing bids
4. IF the edit submission fails, THEN THE Auction_App SHALL display an error message and preserve the edited form data

### Requirement 5: Extend or Close Auction

**User Story:** As an admin or editor, I want quick controls to extend or close an auction item's end time, so that I can respond to event conditions without manual time calculations.

#### Acceptance Criteria

1. THE Auction_App SHALL display "Extend" buttons with options for 5, 15, and 30 minutes alongside each item in the Admin_Table
2. WHEN a Super_Admin or Editor clicks an Extend button, THE Auction_App SHALL add the selected duration to the item's current end time and update the Firestore_Items_Doc
3. THE Auction_App SHALL display a "Close Now" button alongside each active item in the Admin_Table
4. WHEN a Super_Admin or Editor clicks the "Close Now" button, THE Auction_App SHALL set the item's end time to the current timestamp in the Firestore_Items_Doc
5. IF the time update fails, THEN THE Auction_App SHALL display an error message and leave the item's end time unchanged

### Requirement 6: Dashboard Summary

**User Story:** As an admin or editor, I want to see aggregate auction statistics at a glance, so that I can monitor event progress without manually counting items.

#### Acceptance Criteria

1. THE Auction_App SHALL display a Dashboard panel at the top of the admin page showing total items, active items count, ended items count, total bids, and revenue (sum of winning bid amounts)
2. WHEN the Firestore_Items_Doc updates via onSnapshot, THE Dashboard SHALL recalculate and display updated statistics within the same render cycle
3. THE Dashboard SHALL calculate revenue as the sum of the highest bid amount for each ended item where the reserve price has been met (or no reserve is set)

### Requirement 7: Export Results CSV

**User Story:** As an admin, I want to download auction results as a CSV file, so that I can follow up with winners after the event.

#### Acceptance Criteria

1. WHEN a Super_Admin clicks the "Export CSV" button, THE Auction_App SHALL generate a CSV file containing one row per ended item with columns: item title, winning bid amount, winner name, and winner email
2. THE CSV_Export SHALL include only items that have ended and have a winning bid that meets or exceeds the reserve price (or items with no reserve set that have bids)
3. IF no items qualify for export, THEN THE Auction_App SHALL display a message indicating no results are available for export
4. THE CSV_Export SHALL trigger a browser file download with the filename format "auction-results-YYYY-MM-DD.csv"

### Requirement 8: My Bids Page

**User Story:** As a bidder, I want to see all items I have bid on with my current standing, so that I can track which auctions I am winning or losing.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the My_Bids_Page, THE Auction_App SHALL display all items the user has placed bids on
2. THE My_Bids_Page SHALL show for each item: the item title, the user's highest bid amount, the current highest bid amount, and the user's standing (winning or outbid)
3. WHILE the user's highest bid equals the current highest bid for an item, THE My_Bids_Page SHALL display the standing as "Winning"
4. WHILE the user's highest bid is less than the current highest bid for an item, THE My_Bids_Page SHALL display the standing as "Outbid"
5. WHEN the Firestore_Items_Doc updates via onSnapshot, THE My_Bids_Page SHALL reflect the updated standings in real time

### Requirement 9: Outbid Notifications

**User Story:** As a bidder, I want to be notified when someone outbids me, so that I can decide whether to place a higher bid.

#### Acceptance Criteria

1. WHEN another user places a bid that exceeds the current user's highest bid on an item, THE Auction_App SHALL display a Toast_Notification informing the user they have been outbid
2. THE Toast_Notification SHALL include the item title and the new highest bid amount
3. THE Toast_Notification SHALL remain visible for 5 seconds before automatically dismissing
4. WHILE the user is not authenticated or has no active bids, THE Auction_App SHALL suppress outbid notifications

### Requirement 10: Search and Filter Items

**User Story:** As a user, I want to filter and search auction items, so that I can find items of interest without scrolling through the entire list.

#### Acceptance Criteria

1. THE Auction_App SHALL display a Filter_Panel on the home page with controls for: text search, status filter (active/ended/all), price range filter, and "ending soon" toggle
2. WHEN the user enters text in the search field, THE Auction_App SHALL filter displayed items to those whose title or subtitle contains the search text (case-insensitive)
3. WHEN the user selects a status filter, THE Auction_App SHALL display only items matching the selected status (active, ended, or all)
4. WHEN the user sets a price range, THE Auction_App SHALL display only items whose current highest bid (or starting price if no bids) falls within the specified range
5. WHEN the user enables the "ending soon" toggle, THE Auction_App SHALL display only active items with less than 30 minutes remaining
6. THE Filter_Panel SHALL apply all active filters in combination (intersection of results)
