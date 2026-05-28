# Design Document: Admin Delete Item

## Overview

Add a "Delete" button to each item row on the admin page. When clicked, a browser-native confirmation dialog prevents accidental deletion. On confirmation, all Firestore fields for that item (config + bids) are removed in a single `updateDoc` call using `deleteField()`. The UI auto-updates via the existing `onSnapshot` subscription. The item remains in `items.yml` for re-creation via "Update All".

## Architecture

The feature follows the existing pattern established by `editItems` and `computeEditUpdates`:

1. **Pure computation layer** — a new `computeDeleteUpdates` function builds the Firestore update object
2. **Side-effect layer** — a new `deleteItem` function in `firebase/utils.jsx` reads the current document and applies the computed updates
3. **UI layer** — the `Row` component gains a Delete button that calls a handler passed down from `AdminPage`

```
AdminPage
  └─ Table
       └─ Row (receives onDelete prop)
            └─ Delete button → window.confirm → onDelete(itemId)
                                                    │
                                                    ▼
                                          deleteItem(itemId)
                                                    │
                                          ┌─────────┴─────────┐
                                          │ computeDeleteUpdates │ (pure)
                                          └─────────┬─────────┘
                                                    │
                                          updateDoc(docRef, updates)
```

## Components and Interfaces

### `computeDeleteUpdates` (pure function)

Extracted for testability, following the same pattern as `computeEditUpdates`.

**Location:** `src/firebase/utils.jsx`

```javascript
/**
 * Pure function that computes the updates object for deleting an item.
 * Marks all fields matching the given item ID for deletion.
 *
 * @param {Object} params
 * @param {number} params.itemId - The item ID to delete
 * @param {string[]} params.fields - All field keys from the current Firestore document
 * @param {*} params.deleteFieldSentinel - The sentinel value for field deletion
 * @returns {Object} The updates object to apply to Firestore
 */
export const computeDeleteUpdates = ({ itemId, fields, deleteFieldSentinel }) => {
  const updates = {};
  fields
    .filter((field) => parseField(field).item === itemId)
    .forEach((field) => {
      updates[field] = deleteFieldSentinel;
    });
  return updates;
};
```

### `deleteItem` (async, side-effects)

**Location:** `src/firebase/utils.jsx`

```javascript
/**
 * Deletes all Firestore fields for a given item ID from the auction/items document.
 *
 * @param {number} itemId - The item ID to delete
 * @throws {Error} If the Firestore operation fails
 */
export const deleteItem = async (itemId) => {
  const docRef = doc(db, "auction", "items");
  const currentDoc = await getDoc(docRef);
  const fields = Object.keys(currentDoc.data());

  const updates = computeDeleteUpdates({
    itemId,
    fields,
    deleteFieldSentinel: deleteField(),
  });

  await updateDoc(docRef, updates);
};
```

### `Row` component changes

**Location:** `src/components/Row.jsx`

Add an `onDelete` prop. Render a new button after the existing action buttons:

```javascript
<button
  className="btn btn-danger"
  onClick={() => {
    if (window.confirm("Are you sure?")) {
      onDelete(item.id);
    }
  }}
>
  Delete
</button>
```

### `AdminPage` component changes

**Location:** `src/pages/Admin.jsx`

Add a `handleDelete` callback that calls `deleteItem` and uses `showMessage` for feedback:

```javascript
const handleDelete = useCallback(async (itemId) => {
  try {
    await deleteItem(itemId);
    showMessage("Item deleted successfully.");
  } catch (error) {
    console.error("Delete failed:", error);
    showMessage("Delete failed. Please try again.", "danger");
  }
}, []);
```

Pass `onDelete={handleDelete}` through `Table` to each `Row`.

### `Table` component changes

**Location:** `src/components/Table.jsx`

Accept and forward the `onDelete` prop to each `Row`.

### Props additions

| Component | New Prop | Type | Description |
|-----------|----------|------|-------------|
| `Table` | `onDelete` | `(itemId: number) => void` | Callback when delete is confirmed |
| `Row` | `onDelete` | `(itemId: number) => void` | Callback when delete is confirmed |

### Function signatures

| Function | Params | Returns | Side Effects |
|----------|--------|---------|--------------|
| `computeDeleteUpdates` | `{ itemId, fields, deleteFieldSentinel }` | `Object` (update map) | None (pure) |
| `deleteItem` | `(itemId: number)` | `Promise<void>` | Reads + writes Firestore |

## Data Models

No changes to the data model. The feature operates on the existing `auction/items` document structure:

- Fields follow the pattern `itemXXXXX_bidXXXXX`
- `bid00000` is the item config field
- `bid00001`, `bid00002`, etc. are bid entries
- All fields for a given item are removed together using `deleteField()` sentinels

## Error Handling

| Scenario | Handling |
|----------|----------|
| Firestore read fails | `deleteItem` throws; `AdminPage` catches and shows danger message |
| Firestore write fails | `deleteItem` throws; `AdminPage` catches and shows danger message |
| User cancels confirmation | No action taken; item unchanged |
| Item has no fields in document | `computeDeleteUpdates` returns empty object; `updateDoc` is a no-op |

## Testing Strategy

- **Property-based tests** (fast-check + vitest): Validate `computeDeleteUpdates` with randomly generated Firestore documents containing varying numbers of items and bids. This follows the same pattern as the existing `utils.property.test.js`.
- **Unit tests** (vitest + @testing-library/react): Verify Row renders the Delete button with correct styling, confirmation dialog behavior, and AdminPage feedback messages.
- **Integration**: The `onSnapshot` auto-update is covered by existing ItemsProvider behavior and does not require new tests.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Delete targets all fields for the given item

*For any* Firestore document containing fields for multiple items with varying numbers of bids, when `computeDeleteUpdates` is called with a specific item ID, the resulting updates object SHALL contain a delete sentinel for every field matching that item ID (both the config field `bid00000` and all bid fields `bid00001`, `bid00002`, etc.).

**Validates: Requirements 3.1**

### Property 2: Delete does not affect other items

*For any* Firestore document containing fields for multiple items, when `computeDeleteUpdates` is called with a specific item ID, the resulting updates object SHALL NOT contain any fields belonging to other item IDs.

**Validates: Requirements 3.1**

### Property 3: Delete produces correct field count

*For any* Firestore document and any item ID present in that document, the number of entries in the updates object returned by `computeDeleteUpdates` SHALL equal the total number of fields for that item in the original document (1 config field + N bid fields).

**Validates: Requirements 3.1, 3.2**
