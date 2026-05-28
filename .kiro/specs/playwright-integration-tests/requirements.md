# Requirements Document

## Introduction

A comprehensive Playwright end-to-end integration test suite for the Goostrey PTA Ball Auction web application. The tests run against the deployed Firebase-hosted version (goostrey-ball-auction.firebaseapp.com) and cover all pages, authentication flows, role-based access control, bidding, admin operations, filtering, navigation, and UI components. The suite uses dedicated test accounts (regular user, admin, editor) and is designed to run in CI via GitHub Actions.

## Glossary

- **Test_Suite**: The Playwright test project containing all end-to-end integration tests
- **Test_Runner**: The Playwright test execution engine configured to run against the deployed application
- **Deployed_App**: The Firebase-hosted auction application at goostrey-ball-auction.firebaseapp.com
- **Regular_User_Account**: A pre-created Firebase Auth test account with no elevated role (standard "user" permissions)
- **Admin_Account**: A pre-created Firebase Auth test account with the "admin" role in the Firestore users collection
- **Editor_Account**: A pre-created Firebase Auth test account with the "editor" role in the Firestore users collection
- **Anonymous_Visitor**: A user who has not authenticated (no active session)
- **Navbar**: The top navigation bar component that displays different buttons based on authentication state and role
- **Filter_Panel**: The search and filter controls on the Home page (text search, status dropdown, price range inputs, ending-soon toggle)
- **Item_Modal**: The modal dialog that opens when clicking an auction item, showing details and a bid input
- **Login_Modal**: The modal dialog for email/password authentication
- **Sign_Up_Modal**: The modal dialog for new user registration with first name, surname, email, and password fields
- **Forgot_Password_Modal**: The modal dialog for requesting a password reset email
- **Admin_Page**: The protected /admin route accessible to admin and editor roles, showing dashboard stats, item table, and management buttons
- **My_Bids_Page**: The protected /my-bids route showing the authenticated user's bid history
- **User_Management_Page**: The protected /users route accessible only to admin role, showing user table with role management
- **Dashboard**: The statistics cards section on the Admin_Page showing total items, active, ended, total bids, and revenue
- **Toast_Notification**: The notification component that appears when a user is outbid
- **Footer**: The bottom page component showing copyright and GitHub link
- **CI_Pipeline**: The GitHub Actions workflow that executes the Test_Suite automatically

## Requirements

### Requirement 1: Test Infrastructure Setup

**User Story:** As a developer, I want a properly configured Playwright test project, so that I can run end-to-end tests against the deployed auction application.

#### Acceptance Criteria

1. THE Test_Suite SHALL use Playwright as the test framework with a configuration file that sets the base URL to https://goostrey-ball-auction.firebaseapp.com and sets a default navigation timeout of 30000 milliseconds
2. THE Test_Suite SHALL store test account credentials in environment variables loaded from a `.env` file excluded from version control, requiring at minimum variables for test user email and test user password
3. THE Test_Suite SHALL define an npm script named `test:e2e` in package.json that executes Playwright tests in single-run, headless mode
4. THE Test_Suite SHALL configure at least Chromium as a test browser project in the Playwright configuration
5. THE Test_Suite SHALL include a GitHub Actions workflow file under `.github/workflows/` that installs dependencies, installs Playwright browsers, injects credentials from repository secrets into environment variables, and executes the e2e tests
6. THE Test_Suite SHALL use a global setup file that authenticates a test account via the application login page and persists the resulting storage state to a JSON file, which is referenced in the Playwright configuration so that all test files start in an authenticated state
7. IF the global setup authentication fails, THEN THE Test_Suite SHALL abort the test run and report an error message indicating the authentication failure reason

### Requirement 2: Home Page Rendering

**User Story:** As a developer, I want tests that verify the Home page renders correctly, so that I can catch regressions in the main auction grid display.

#### Acceptance Criteria

1. WHEN the Deployed_App root URL is loaded, THE Test_Suite SHALL verify that the document title contains "Markatplace" and that the navigation bar is rendered
2. WHEN the Deployed_App root URL is loaded, THE Test_Suite SHALL verify that at least 1 auction item card is rendered within a Bootstrap grid container (element with class "row")
3. WHEN the Deployed_App root URL is loaded, THE Test_Suite SHALL verify that each rendered item card displays a title (text content in a heading element), a subtitle (text in a secondary-text element), a current bid amount (formatted as currency), and a bid count (text matching the pattern "N bids")
4. WHEN the Deployed_App root URL is loaded, THE Test_Suite SHALL verify that the Filter_Panel is visible containing a text input with placeholder "Search items...", a status dropdown with options "All", "Active", and "Ended", two numeric inputs for minimum and maximum price, and a checkbox labelled "Ending soon"

### Requirement 3: Filter Panel Functionality

**User Story:** As a developer, I want tests that verify the filter panel works correctly, so that I can ensure users can search and filter auction items.

#### Acceptance Criteria

1. WHEN text is entered in the search input, THE Test_Suite SHALL verify that the displayed items are filtered to only those whose title or subtitle contains the search text as a case-insensitive substring match
2. WHEN the status dropdown is changed to "Active", THE Test_Suite SHALL verify that only items whose endTime is in the future are displayed
3. WHEN the status dropdown is changed to "Ended", THE Test_Suite SHALL verify that only items whose endTime is in the past are displayed
4. WHEN a minimum price value is entered, THE Test_Suite SHALL verify that only items with a current price (highest bid amount, or startingPrice if no bids exist) at or above the minimum are displayed
5. WHEN a maximum price value is entered, THE Test_Suite SHALL verify that only items with a current price (highest bid amount, or startingPrice if no bids exist) at or below the maximum are displayed
6. WHEN the ending-soon checkbox is checked, THE Test_Suite SHALL verify that only active items with less than 30 minutes remaining until endTime are displayed
7. WHEN multiple filters are active simultaneously, THE Test_Suite SHALL verify that only items satisfying all active filter conditions are displayed

### Requirement 4: Navbar Display and Navigation

**User Story:** As a developer, I want tests that verify the navbar displays correct buttons and navigates properly based on auth state, so that I can ensure role-based UI is correct.

#### Acceptance Criteria

1. WHILE an Anonymous_Visitor is browsing, THE Test_Suite SHALL verify that the Navbar displays "Login", "Sign up", and "Forgot Password" buttons
2. WHILE an Anonymous_Visitor is browsing, THE Test_Suite SHALL verify that the Navbar does not display "Admin", "Users", "My Bids", or "Sign out" buttons and does not display a greeting
3. WHILE a Regular_User_Account is authenticated, THE Test_Suite SHALL verify that the Navbar displays "My Bids" and "Sign out" buttons and a greeting in the format "Hi {firstName}" where firstName is the first whitespace-delimited token of the user's display name
4. WHILE a Regular_User_Account is authenticated, THE Test_Suite SHALL verify that the Navbar does not display "Admin" or "Users" buttons
5. WHILE an Admin_Account is authenticated, THE Test_Suite SHALL verify that the Navbar displays "Admin", "Users", "My Bids", and "Sign out" buttons and a greeting in the format "Hi {firstName}"
6. WHILE an Editor_Account is authenticated, THE Test_Suite SHALL verify that the Navbar displays "Admin", "My Bids", and "Sign out" buttons but not "Users", and displays a greeting in the format "Hi {firstName}"
7. WHEN the "Admin" button is clicked by an authenticated user with admin or editor role, THE Test_Suite SHALL verify that the browser navigates to the /admin route
8. WHEN the "My Bids" button is clicked by an authenticated user, THE Test_Suite SHALL verify that the browser navigates to the /my-bids route
9. WHEN the "Users" button is clicked by an authenticated user with admin role, THE Test_Suite SHALL verify that the browser navigates to the /users route

### Requirement 5: Login Modal

**User Story:** As a developer, I want tests that verify the login flow works correctly, so that I can ensure users can authenticate.

#### Acceptance Criteria

1. WHEN the "Login" button in the Navbar is clicked, THE Test_Suite SHALL verify that the Login_Modal opens displaying a modal title, an email input field, a password input field, a "Forgot Password?" link, a "Cancel" button, and a "Login" submit button
2. WHEN a valid email and password combination for an email-verified account is submitted in the Login_Modal, THE Test_Suite SHALL verify that a success feedback message is displayed, and the modal closes within 1000 milliseconds of the success message appearing
3. IF invalid credentials (incorrect email or wrong password) are submitted in the Login_Modal, THEN THE Test_Suite SHALL verify that an error feedback message is displayed indicating the credentials should be checked, and the modal remains open with the form inputs preserved
4. IF valid credentials are submitted but the account email is not verified, THEN THE Test_Suite SHALL verify that the user is signed out, an error feedback message is displayed indicating email verification is required, and the modal remains open
5. WHEN the "Cancel" button is clicked in the Login_Modal, THE Test_Suite SHALL verify that the modal closes without triggering authentication
6. WHEN the "Forgot Password?" link is clicked in the Login_Modal, THE Test_Suite SHALL verify that the Login_Modal closes and the Forgot_Password_Modal opens

### Requirement 6: Sign Up Modal

**User Story:** As a developer, I want tests that verify the sign-up flow validates input correctly, so that I can ensure registration works and catches invalid names.

#### Acceptance Criteria

1. WHEN the "Sign up" button in the Navbar is clicked, THE Test_Suite SHALL verify that the Sign_Up_Modal opens with first name, surname, email, and password input fields
2. WHEN a first name containing characters other than Unicode letters, hyphens, or apostrophes is submitted, THE Test_Suite SHALL verify that a validation error is displayed for the first name field indicating that the name can only contain letters, hyphens, and apostrophes
3. WHEN a surname containing characters other than Unicode letters, hyphens, or apostrophes is submitted, THE Test_Suite SHALL verify that a validation error is displayed for the surname field indicating that the name can only contain letters, hyphens, and apostrophes
4. WHEN an empty or whitespace-only first name is submitted, THE Test_Suite SHALL verify that a validation error is displayed indicating the name is required
5. WHEN the "Cancel" button is clicked in the Sign_Up_Modal, THE Test_Suite SHALL verify that the modal closes and no Firebase account creation request is made
6. WHEN a first name or surname shorter than 2 characters or longer than 50 characters is submitted, THE Test_Suite SHALL verify that a validation error is displayed indicating the length constraint violation
7. IF the Firebase createUserWithEmailAndPassword call rejects with an error, THEN THE Test_Suite SHALL verify that the error message is displayed to the user in the Sign_Up_Modal

### Requirement 7: Forgot Password Modal

**User Story:** As a developer, I want tests that verify the password reset flow, so that I can ensure users can recover their accounts.

#### Acceptance Criteria

1. WHEN the "Forgot Password" button in the Navbar is clicked, THE Test_Suite SHALL verify that the Forgot_Password_Modal opens displaying a title "Reset your password", an email input field of type "email", a "Cancel" button, and a "Send email" submit button
2. WHEN a valid email is submitted in the Forgot_Password_Modal (sendPasswordResetEmail resolves successfully), THE Test_Suite SHALL verify that the email input receives valid feedback styling and a success message containing "Password reset email sent!" is displayed
3. WHEN an invalid email is submitted in the Forgot_Password_Modal (sendPasswordResetEmail rejects with an error), THE Test_Suite SHALL verify that the email input receives invalid feedback styling and an error message containing "Error sending password reset email" is displayed
4. WHEN the "Cancel" button is clicked in the Forgot_Password_Modal, THE Test_Suite SHALL verify that the modal is removed from the rendered DOM
5. WHEN the "Forgot Password?" link in the Login_Modal is clicked, THE Test_Suite SHALL verify that the Login_Modal closes and the Forgot_Password_Modal opens with the email input field and "Send email" submit button

### Requirement 8: Item Modal and Bidding

**User Story:** As a developer, I want tests that verify the item modal displays correctly and bidding validation works, so that I can ensure the core auction functionality is reliable.

#### Acceptance Criteria

1. WHEN an item card is clicked on the Home page, THE Test_Suite SHALL verify that the Item_Modal opens displaying the item title, detail paragraph, secondary image (with alt text matching the item title), a currency-prefixed bid input field, and a "Submit bid" button
2. WHEN the Item_Modal is open, THE Test_Suite SHALL verify that the minimum bid label displays "Enter {currency}{highestBid + 1.00} or more" where highestBid is the current highest bid amount or the starting price if no bids exist
3. WHILE an Anonymous_Visitor has the Item_Modal open and submits a bid, THE Test_Suite SHALL verify that the text "You must be logged in to place a bid" is displayed and the input receives an invalid state
4. WHILE a Regular_User_Account is authenticated and submits a bid amount below the minimum required (highest bid + £1.00), THE Test_Suite SHALL verify that the validation error "Bid must be at least £{minimumRequired}" is displayed where minimumRequired is formatted to 2 decimal places
5. WHILE a Regular_User_Account is authenticated and submits a non-numeric bid value, THE Test_Suite SHALL verify that the validation error "Please enter a valid monetary amount" is displayed
6. WHILE a Regular_User_Account is authenticated and submits a valid bid (numeric, at or above minimum) on an active item, THE Test_Suite SHALL verify that the input receives a valid state and the modal closes within 2 seconds
7. WHILE a Regular_User_Account is authenticated and submits a valid bid, THE Test_Suite SHALL verify that the "Submit bid" button becomes disabled during bid processing to prevent duplicate submissions
8. WHEN the modal backdrop is clicked, THE Test_Suite SHALL verify that the Item_Modal closes
9. WHEN the close button is clicked, THE Test_Suite SHALL verify that the Item_Modal closes

### Requirement 9: Admin Page Access and Dashboard

**User Story:** As a developer, I want tests that verify the admin page is properly protected and displays correct dashboard statistics, so that I can ensure role-based access control works.

#### Acceptance Criteria

1. WHEN an Anonymous_Visitor navigates to /admin, THE Test_Suite SHALL verify that the user is redirected to the application base URL
2. WHEN a Regular_User_Account navigates to /admin, THE Test_Suite SHALL verify that the user is redirected to the application base URL and the Admin_Page content is not rendered
3. WHILE an Admin_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that the Dashboard displays cards for "Total Items", "Active", "Ended", "Total Bids", and "Revenue"
4. WHILE an Editor_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that the Dashboard displays cards for "Total Items", "Active", "Ended", "Total Bids", and "Revenue"
5. WHILE an Admin_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that "Update All", "Reset All", "Update & Reset All", "Add Item", and "Export CSV" buttons are visible
6. WHILE an Editor_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that "Update All", "Update & Reset All", and "Add Item" buttons are visible and that "Reset All" and "Export CSV" buttons are not present in the DOM

### Requirement 10: Admin Page Item Table

**User Story:** As a developer, I want tests that verify the admin item table displays and functions correctly, so that I can ensure item management works.

#### Acceptance Criteria

1. WHILE an Admin_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that the item table displays column headers (ID, Title, Price, Reserve Price, Bids, Winner, Time Left, Actions) and that each item row renders the corresponding values for those columns
2. WHILE an Admin_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that each item row contains an "Edit" button and a "Delete" button within the Actions column
3. WHILE an Admin_Account is authenticated and on the Admin_Page, THE Test_Suite SHALL verify that each item row contains a reserve price input field that displays the item's current reserve price value
4. WHEN the "Add Item" button is clicked on the Admin_Page, THE Test_Suite SHALL verify that an item form modal opens with empty fields for title, subtitle, detail, primary image, secondary image, end time, starting price, reserve price, and currency
5. WHEN an edit button is clicked on an item row, THE Test_Suite SHALL verify that the item form modal opens with the title, subtitle, detail, primary image, secondary image, end time, starting price, reserve price, and currency fields pre-populated with that item's existing values
6. WHEN a bid count link is clicked on an item row, THE Test_Suite SHALL verify that a bidder list modal opens displaying a table with columns for First Name, Surname, Email, Bid Time, and Bid amount for each bidder on that item
7. WHEN a bid count link is clicked on an item row that has no bids, THE Test_Suite SHALL verify that the bidder list modal displays a "No bids placed" message

### Requirement 11: My Bids Page

**User Story:** As a developer, I want tests that verify the My Bids page displays correctly, so that I can ensure users can track their bids.

#### Acceptance Criteria

1. WHEN an Anonymous_Visitor navigates to /my-bids, THE Test_Suite SHALL verify that the user is redirected to the home page
2. WHILE a Regular_User_Account with existing bids is authenticated and on the My_Bids_Page, THE Test_Suite SHALL verify that a list of bids is displayed where each bid entry shows the item title, the user's highest bid amount prefixed with "Your bid:", the current highest bid amount prefixed with "Highest:", and a standing badge displaying one of the values "Winning" (green), "Outbid" (red), or "Reserve Not Met" (yellow)
3. WHILE a Regular_User_Account with no bids is authenticated and on the My_Bids_Page, THE Test_Suite SHALL verify that a "You haven't placed any bids yet" message is displayed
4. WHILE a Regular_User_Account is on the My_Bids_Page viewing an active item (endTime is in the future) where the user's standing is "Outbid" or "Reserve Not Met", THE Test_Suite SHALL verify that a "Bid Again" button is displayed for that item and that clicking it opens the item bid modal
5. WHILE a Regular_User_Account is on the My_Bids_Page viewing an item where the user's standing is "Winning" or the item's endTime has passed, THE Test_Suite SHALL verify that no "Bid Again" button is displayed for that item

### Requirement 12: User Management Page

**User Story:** As a developer, I want tests that verify the user management page is properly protected and functions correctly, so that I can ensure only admins can manage user roles.

#### Acceptance Criteria

1. WHEN an Anonymous_Visitor navigates to /users, THE Test_Suite SHALL verify that the user is redirected to the home page
2. WHEN a Regular_User_Account navigates to /users, THE Test_Suite SHALL verify that the user is redirected to the home page
3. WHEN an Editor_Account navigates to /users, THE Test_Suite SHALL verify that the user is redirected to the home page
4. WHILE an Admin_Account is authenticated and on the User_Management_Page, THE Test_Suite SHALL verify that a user table is displayed with columns for Name (firstName and surname), Email, and Role, with rows sorted alphabetically by surname then firstName (case-insensitive)
5. WHILE an Admin_Account is authenticated and on the User_Management_Page, THE Test_Suite SHALL verify that a search input is present and filters the user list on each keystroke by case-insensitive substring match against firstName, surname, or email fields
6. WHILE an Admin_Account is authenticated and on the User_Management_Page, THE Test_Suite SHALL verify that each user row has a role dropdown with options "Admin", "Editor", and "User", pre-selected to the user's current role
7. WHILE an Admin_Account is viewing their own row on the User_Management_Page, THE Test_Suite SHALL verify that the role dropdown is disabled with a message "You cannot change your own role"
8. WHEN an Admin_Account selects a new role for another user from the role dropdown, THE Test_Suite SHALL verify that the dropdown is disabled during the update and a success message is displayed within 5 seconds upon completion
9. IF a role update fails due to a Firestore write error, THEN THE Test_Suite SHALL verify that the role dropdown reverts to the previous value and an error message is displayed for 5 seconds

### Requirement 13: Footer Component

**User Story:** As a developer, I want tests that verify the footer renders correctly, so that I can catch regressions in the page layout.

#### Acceptance Criteria

1. WHEN any page of the Deployed_App is loaded, THE Test_Suite SHALL verify that a `<footer>` element is rendered in the DOM containing a copyright symbol (©), the current four-digit year, and at least one author name
2. WHEN any page of the Deployed_App is loaded, THE Test_Suite SHALL verify that the `<footer>` element contains a link whose href begins with "https://github.com/" and that the link is accessible (has a visible icon or accessible label)
3. IF the Footer component is rendered, THEN THE Test_Suite SHALL verify that the copyright year displayed matches the year returned by the system clock at the time of rendering

### Requirement 14: Toast Notifications

**User Story:** As a developer, I want tests that verify toast notifications appear and dismiss correctly, so that I can ensure the notification system works.

#### Acceptance Criteria

1. WHEN a user is outbid on an item, THE Test_Suite SHALL verify that a toast notification appears containing the header text "Outbid", the item title, and the new highest bid amount with currency symbol
2. WHEN a toast notification is displayed, THE Test_Suite SHALL verify that clicking the close button removes the notification from the DOM
3. WHEN a toast notification is displayed, THE Test_Suite SHALL verify that the notification auto-dismisses after exactly 5000 milliseconds and does not dismiss before 5000 milliseconds have elapsed
4. WHEN no outbid events have occurred, THE Test_Suite SHALL verify that no toast notification elements are rendered in the DOM

### Requirement 15: Responsive Layout

**User Story:** As a developer, I want tests that verify the application renders correctly on different viewport sizes, so that I can ensure mobile and desktop layouts work.

#### Acceptance Criteria

1. WHEN the Deployed_App is loaded at a mobile viewport width (375px), THE Test_Suite SHALL verify that all item cards in the item grid are stacked vertically with each card occupying the full width of the grid container (single-column layout)
2. WHEN the Deployed_App is loaded at a desktop viewport width (1280px), THE Test_Suite SHALL verify that the item grid displays items in rows of 3 columns
3. WHEN the Deployed_App is loaded at a mobile viewport width (375px), THE Test_Suite SHALL verify that the Filter_Panel controls each occupy the full container width and are stacked vertically (one control per row)
4. WHEN the Deployed_App viewport is resized from 767px to 768px, THE Test_Suite SHALL verify that the item grid transitions from a single-column layout to a 3-column layout

### Requirement 16: CI Integration

**User Story:** As a developer, I want the Playwright tests to run automatically in CI, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL install Playwright browsers and OS-level dependencies before test execution
2. THE CI_Pipeline SHALL execute the Test_Suite using the npm script defined for Playwright end-to-end tests in package.json
3. THE CI_Pipeline SHALL store test account credentials as GitHub Actions secrets (not in the workflow file)
4. IF a test fails in the CI_Pipeline, THEN THE CI_Pipeline SHALL upload the Playwright HTML report and trace files as workflow artifacts retained for 30 days
5. THE CI_Pipeline SHALL run on pull requests targeting the main branch and on pushes to the main branch
6. THE CI_Pipeline SHALL report a pass/fail status check on the pull request so that a failing test run blocks merging
7. THE CI_Pipeline SHALL enforce a maximum job timeout of 30 minutes for the test execution step
