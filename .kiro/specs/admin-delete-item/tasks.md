# Implementation Plan: Admin Delete Item

## Overview

Add a Delete button to each item row on the admin page. Clicking it shows a browser-native confirmation dialog; on confirmation, all Firestore fields for that item are removed via a single `updateDoc` call using `deleteField()`. The UI auto-updates through the existing `onSnapshot` subscription.

## Tasks

- [ ] 1. Implement `computeDeleteUpdates` and `deleteItem` in firebase utils
  - [ ] 1.1 Add `computeDeleteUpdates` pure function to `src/firebase/utils.jsx`
    - Implement the function that takes `{ itemId, fields, deleteFieldSentinel }` and returns an updates object mapping every field matching the item ID to the delete sentinel
    - Reuse the existing `parseField` helper to identify matching fields
    - Export the function for use in tests and the `deleteItem` function
    - _Requirements: 3.1, 3.2_

  - [ ] 1.2 Add `deleteItem` async function to `src/firebase/utils.jsx`
    - Import `deleteField` from `firebase/firestore` (already imported)
    - Read the current `auction/items` document, extract field keys
    - Call `computeDeleteUpdates` with the field keys and `deleteField()` sentinel
    - Apply the updates with a single `updateDoc` call
    - _Requirements: 3.1, 3.2_

  - [ ]* 1.3 Write property test: Delete targets all fields for the given item (Property 1)
    - **Property 1: Delete targets all fields for the given item**
    - **Validates: Requirements 3.1**
    - Add tests to a new file `src/firebase/utils.delete.property.test.js`
    - Reuse the `firestoreDocArb` generator pattern from `utils.property.test.js`
    - Assert that every field matching the target item ID appears in the updates object with the delete sentinel

  - [ ]* 1.4 Write property test: Delete does not affect other items (Property 2)
    - **Property 2: Delete does not affect other items**
    - **Validates: Requirements 3.1**
    - Assert that no field belonging to a different item ID appears in the updates object

  - [ ]* 1.5 Write property test: Delete produces correct field count (Property 3)
    - **Property 3: Delete produces correct field count**
    - **Validates: Requirements 3.1, 3.2**
    - Assert that the number of entries in the updates object equals the total number of fields for that item in the source document

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Add Delete button to Row and wire through Table and AdminPage
  - [ ] 3.1 Update `src/components/Row.jsx` to accept `onDelete` prop and render Delete button
    - Add `onDelete` to the component's props and PropTypes
    - Render a `btn-danger` button with text "Delete" after the existing action buttons
    - On click, show `window.confirm("Are you sure?")` and call `onDelete(item.id)` only if confirmed
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [ ] 3.2 Update `src/components/Table.jsx` to accept and forward `onDelete` prop
    - Add `onDelete` to the component's props and PropTypes
    - Pass `onDelete` to each `Row` component
    - _Requirements: 1.1_

  - [ ] 3.3 Update `src/pages/Admin.jsx` to define `handleDelete` and pass it to Table
    - Import `deleteItem` from `../firebase/utils`
    - Create a `handleDelete` callback using `useCallback` that calls `deleteItem(itemId)`, shows a success message on completion, and catches errors to show a danger message
    - Pass `onDelete={handleDelete}` to the `Table` component
    - _Requirements: 4.1, 4.2, 5.1_

  - [ ]* 3.4 Write unit tests for Row Delete button rendering and confirmation behavior
    - Verify the Delete button renders with `btn-danger` class and "Delete" text
    - Verify `onDelete` is called with the item ID when confirmation is accepted
    - Verify `onDelete` is NOT called when confirmation is dismissed
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 4. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The existing `onSnapshot` subscription in `ItemsProvider` handles UI auto-update after deletion — no new code needed for Requirement 3.3
- Requirement 5.2 (re-creation via "Update All") is already satisfied by the existing `editItems` logic and requires no new code

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4"] }
  ]
}
```
