# Requirements Document

## Introduction

A user management page for the Goostrey PTA Ball Auction app that allows administrators (role "admin") to view all registered users and manage their roles. The page provides a centralised interface for listing users, searching/filtering them, and assigning roles (admin, editor, or regular user). Only users with the "admin" role may access this page; editors and regular users are excluded.

## Glossary

- **User_Management_Page**: The dedicated page within the application that displays all registered users and provides role management controls
- **Admin**: A user whose resolved role is "admin"; the only role permitted to access the User Management Page
- **Editor**: A user whose resolved role is "editor"; may access the existing Admin page but not the User Management Page
- **Regular_User**: A user with no special role (empty string role); has no access to administrative pages
- **User_Document**: The Firestore document at `users/{uid}` containing fields: firstName, surname, name, email, role
- **Role_Selector**: A UI control that allows an Admin to change another user's role to "admin", "editor", or "" (regular user)
- **User_List**: The table or list component displaying all User Documents with their details and role information
- **Role_Field**: The `role` field in the Firestore user document storing one of "admin", "editor", or ""

## Requirements

### Requirement 1: Page Access Control

**User Story:** As an admin, I want the user management page restricted to admin-role users only, so that editors and regular users cannot modify user roles.

#### Acceptance Criteria

1. WHEN a user with role "admin" navigates to the User Management Page route, THE User_Management_Page SHALL render the page content
2. WHEN a user with role "editor" navigates to the User Management Page route, THE User_Management_Page SHALL redirect the user to the home page without rendering any User_Management_Page content
3. WHEN a Regular_User navigates to the User Management Page route, THE User_Management_Page SHALL redirect the user to the home page without rendering any User_Management_Page content
4. WHEN an unauthenticated user navigates to the User Management Page route, THE User_Management_Page SHALL redirect the user to the home page without rendering any User_Management_Page content
5. WHILE the user's role is being resolved from Firestore, THE User_Management_Page SHALL not render page content and SHALL display a loading indicator until the role check completes

### Requirement 2: Display All Users

**User Story:** As an admin, I want to see a list of all registered users with their details, so that I can understand who is using the system and what roles they have.

#### Acceptance Criteria

1. WHEN the User_Management_Page loads, THE User_List SHALL display all User Documents from the Firestore `users` collection, sorted alphabetically by surname then firstName
2. THE User_List SHALL display the following fields for each user: firstName, surname, email, and the current Role_Field value displayed as "Admin", "Editor", or "User" for role values "admin", "editor", and "" respectively
3. WHEN the Firestore `users` collection contains zero documents, THE User_List SHALL display a message indicating no users are found
4. WHILE the User_List is loading data from Firestore, THE User_Management_Page SHALL display a loading indicator
5. IF the Firestore query for the `users` collection fails, THEN THE User_Management_Page SHALL display an error message indicating the user list could not be loaded

### Requirement 3: Search and Filter Users

**User Story:** As an admin, I want to search and filter the user list, so that I can quickly find specific users when the list is large.

#### Acceptance Criteria

1. THE User_Management_Page SHALL display a text search input above the User_List
2. WHEN the Admin types into the search input, THE User_List SHALL filter within 300 milliseconds to show only users whose firstName, surname, or email contains the search text as a substring match (case-insensitive)
3. WHEN the search input is cleared, THE User_List SHALL display all users in the unfiltered order
4. IF the search text matches no users, THEN THE User_List SHALL display a message indicating no users match the current search
5. WHILE the User_List is filtered, THE User_Management_Page SHALL display the count of matching users out of the total user count

### Requirement 4: Change User Role

**User Story:** As an admin, I want to change any user's role, so that I can grant or revoke elevated permissions as needed.

#### Acceptance Criteria

1. THE User_Management_Page SHALL display a Role_Selector for each user in the User_List with options labelled "Admin" (value "admin"), "Editor" (value "editor"), and "User" (value "", regular user), with the user's current role pre-selected
2. WHEN the Admin selects a new role from the Role_Selector that differs from the user's current role, THE User_Management_Page SHALL disable the Role_Selector for that user and update the `role` field in the corresponding User_Document in Firestore
3. WHEN a role update succeeds, THE User_Management_Page SHALL re-enable the Role_Selector and display a success confirmation message visible for 5 seconds
4. IF a role update fails, THEN THE User_Management_Page SHALL re-enable the Role_Selector, revert it to the previous value, and display an error message visible for 5 seconds

### Requirement 5: Prevent Self-Demotion

**User Story:** As an admin, I want to be prevented from removing my own admin role, so that the system always retains at least one admin who can manage users.

#### Acceptance Criteria

1. THE User_Management_Page SHALL render the Role_Selector for the currently signed-in Admin user in a disabled state (non-interactive, visually greyed out, with `aria-disabled="true"`)
2. THE User_Management_Page SHALL display a text label adjacent to the currently signed-in Admin user's entry in the User_List indicating that their own role cannot be changed
3. IF the currently signed-in Admin attempts to update their own Role_Field via a direct Firestore write, THEN THE Firestore_Rules SHALL deny the write operation and leave the Role_Field unchanged

### Requirement 6: Navigation Access

**User Story:** As an admin, I want a navigation link to the user management page, so that I can easily access it from anywhere in the app.

#### Acceptance Criteria

1. WHILE a user with role "admin" is signed in, THE Navbar SHALL display a link labelled "Users" that navigates to the User Management Page
2. WHILE a user with role "editor" is signed in, THE Navbar SHALL NOT display the "Users" link
3. WHILE a user with role "" (regular user) or an unauthenticated user is viewing the app, THE Navbar SHALL NOT display the "Users" link
4. WHEN an Admin clicks the "Users" link, THE Auction_App SHALL navigate to the User Management Page without a full page reload

### Requirement 7: Firestore Security Rules

**User Story:** As an admin, I want Firestore rules to enforce that only admins can read all user documents and update roles, so that the access control cannot be bypassed via direct API calls.

#### Acceptance Criteria

1. WHEN an authenticated user with role "admin" (as stored in their own `users/{uid}` document's Role_Field) reads any document in the `users` collection, THE Firestore_Rules SHALL allow the read operation
2. IF an authenticated user without role "admin" attempts to read a user document other than their own (`users/{uid}` where uid ≠ the requester's auth uid), THEN THE Firestore_Rules SHALL deny the read operation
3. WHEN an authenticated user reads their own document (`users/{uid}` where uid matches the requester's auth uid), THE Firestore_Rules SHALL allow the read operation regardless of role
4. WHEN an authenticated user with role "admin" updates the Role_Field on any document in the `users` collection, THE Firestore_Rules SHALL allow the write operation
5. IF an authenticated user without role "admin" attempts to update the Role_Field on any document in the `users` collection (including their own), THEN THE Firestore_Rules SHALL deny the write operation
6. WHEN an authenticated user writes to their own document (`users/{uid}` where uid matches the requester's auth uid) without modifying the Role_Field, THE Firestore_Rules SHALL allow the write operation
7. IF an unauthenticated request attempts to read or write any document in the `users` collection, THEN THE Firestore_Rules SHALL deny the operation
