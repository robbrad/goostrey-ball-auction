# Requirements Document

## Introduction

Add a "Delete Item" button to the admin page that removes an auction item from Firestore. The item is only removed from the live Firestore document — it remains in `items.yml` so it can be re-added later via the existing "Update All" action. Deletion requires a confirmation dialog to prevent accidental removal.

## Glossary

- **Admin_Page**: The administrative interface rendered by the `AdminPage` component where auction items are managed.
- **Delete_Button**: A Bootstrap `btn-danger` styled button placed inline with existing action buttons in each item row.
- **Confirmation_Dialog**: A browser-native confirmation prompt displayed before executing a delete operation.
- **Firestore_Document**: The single Firestore document at path `auction/items` that stores all item and bid data as flat fields keyed `itemXXXXX_bidXXXXX`.
- **Item_Fields**: All Firestore document fields matching the pattern `item{id}_bid*` for a given item ID, including the base field (`bid0`) and all bid fields (`bid1`, `bid2`, etc.).
- **Items_Provider**: The React context provider that subscribes to the Firestore document via `onSnapshot` and propagates item state to the UI.

## Requirements

### Requirement 1: Delete Button Placement

**User Story:** As an admin, I want a clearly visible delete button on each item row, so that I can initiate deletion of a specific item.

#### Acceptance Criteria

1. THE Admin_Page SHALL render a Delete_Button in the actions cell of each item row, inline with the existing Update, Reset, and Update & Reset buttons.
2. THE Delete_Button SHALL use the Bootstrap `btn-danger` class to visually distinguish it from other action buttons.
3. THE Delete_Button SHALL display the text "Delete".

### Requirement 2: Confirmation Before Deletion

**User Story:** As an admin, I want to confirm before an item is deleted, so that I do not accidentally remove items.

#### Acceptance Criteria

1. WHEN the admin clicks the Delete_Button, THE Admin_Page SHALL display a Confirmation_Dialog with the message "Are you sure?".
2. IF the admin dismisses or cancels the Confirmation_Dialog, THEN THE Admin_Page SHALL take no further action and the item SHALL remain unchanged.
3. WHEN the admin confirms the Confirmation_Dialog, THE Admin_Page SHALL proceed with the delete operation.

### Requirement 3: Firestore Field Removal

**User Story:** As an admin, I want the delete operation to remove all Firestore fields for the selected item, so that the item no longer appears in the auction.

#### Acceptance Criteria

1. WHEN the delete operation proceeds, THE Admin_Page SHALL remove all Item_Fields matching the pattern `item{id}_bid*` from the Firestore_Document using `deleteField()`.
2. THE Admin_Page SHALL execute the removal as a single `updateDoc` call to the Firestore_Document.
3. WHEN the Firestore_Document is updated, THE Items_Provider SHALL automatically remove the deleted item from the UI via the existing `onSnapshot` subscription.

### Requirement 4: User Feedback on Deletion

**User Story:** As an admin, I want feedback after a delete operation, so that I know whether it succeeded or failed.

#### Acceptance Criteria

1. WHEN the delete operation completes successfully, THE Admin_Page SHALL display a success message via the existing `showMessage` mechanism.
2. IF the delete operation fails, THEN THE Admin_Page SHALL display an error message via the existing `showMessage` mechanism with the danger type.

### Requirement 5: Item Preservation in Configuration

**User Story:** As an admin, I want deleted items to remain in `items.yml`, so that I can re-add them later using "Update All".

#### Acceptance Criteria

1. THE Admin_Page SHALL remove item data from the Firestore_Document only and SHALL NOT modify the `items.yml` file.
2. WHEN the admin runs "Update All" after a deletion, THE Admin_Page SHALL re-create the deleted item in the Firestore_Document from `items.yml` data using the existing `editItems` logic.
