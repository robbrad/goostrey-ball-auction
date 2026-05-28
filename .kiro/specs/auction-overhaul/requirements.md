# Requirements Document

## Introduction

This document specifies the requirements for overhauling the Goostrey PTA Ball Auction site. The overhaul addresses four areas: enhanced user registration capturing first name and surname as mandatory fields, a reserve price mechanism for auction items, version-controlled Firebase database deployment configuration, and bug fixes to improve overall reliability and quality of the existing application.

## Glossary

- **Auction_System**: The Goostrey PTA Ball Auction web application built with React, Vite, and Firebase
- **Registration_Form**: The sign-up modal where new users create an account
- **Bidding_Module**: The component responsible for accepting and validating user bids on auction items
- **Admin_Panel**: The protected page where administrators manage auction items and monitor bidding
- **Reserve_Price**: The minimum price an item must reach before the auction result is considered valid
- **User_Profile**: The Firestore document storing a registered user's information (name, email, admin status)
- **Item_Document**: The Firestore document fields representing an auction item's configuration and bid history
- **Firestore_Rules**: The security rules file that controls read/write access to Firestore documents
- **Firestore_Indexes**: The index configuration file that defines composite indexes for Firestore queries
- **Firebase_Config**: The firebase.json configuration file that defines deployment targets and settings for the Firebase CLI
- **Deployment_Pipeline**: The CI/CD workflow that automates deployment of Firebase resources (rules, indexes) alongside the application

## Requirements

### Requirement 1: Mandatory First Name and Surname at Registration

**User Story:** As a bidder, I want to provide my first name and surname when registering, so that my identity is clearly captured and displayed during the auction.

#### Acceptance Criteria

1. WHEN a user opens the Registration_Form, THE Registration_Form SHALL display mandatory input fields for first name (maximum 50 characters), surname (maximum 50 characters), email, and password
2. WHEN a user submits the Registration_Form with a first name field that is empty or contains only whitespace, THE Registration_Form SHALL display a validation error indicating that first name is required
3. WHEN a user submits the Registration_Form with a surname field that is empty or contains only whitespace, THE Registration_Form SHALL display a validation error indicating that surname is required
4. WHEN a user successfully registers, THE Auction_System SHALL store the first name and surname in the User_Profile document in Firestore
5. WHEN a user successfully registers, THE Auction_System SHALL set the Firebase Auth display name to the format "FirstName Surname"
6. WHILE a user is signed in, THE Auction_System SHALL display the user's first name (extracted from the stored display name) in the navigation bar greeting
7. WHEN a user submits the Registration_Form with a first name or surname shorter than 2 characters or containing characters other than letters, hyphens, or apostrophes, THE Registration_Form SHALL display a validation error indicating the name is invalid

### Requirement 2: Reserve Price on Auction Items

**User Story:** As an administrator, I want to set a reserve price on auction items, so that items are not sold below their minimum acceptable value.

#### Acceptance Criteria

1. THE Item_Document SHALL support an optional reserve price field that stores a numeric monetary value with up to two decimal places in the range 0.01 to 999,999.99
2. WHEN an administrator configures an auction item, THE Admin_Panel SHALL provide an input to set or update the reserve price for that item
3. WHEN the auction end time is reached and the highest bid is below the reserve price or no bids have been placed, THE Auction_System SHALL display the item status as "Reserve Not Met"
4. WHEN the auction end time is reached and the highest bid meets or exceeds the reserve price, THE Auction_System SHALL display the item status as "Sold"
5. WHILE an item's end time has not been reached, THE Auction_System SHALL NOT display the reserve price value to non-admin users
6. WHILE an administrator views the Admin_Panel, THE Admin_Panel SHALL display the reserve price alongside each item's current highest bid
7. WHEN the auction end time is reached and no reserve price has been set for the item, THE Auction_System SHALL display the item status as "Sold" if at least one bid exists

### Requirement 3: Bid Validation and Integrity

**User Story:** As a bidder, I want confidence that my bids are properly validated, so that the auction operates fairly and without errors.

#### Acceptance Criteria

1. WHEN a user submits a bid, THE Bidding_Module SHALL verify the bid amount is a positive numeric value with no more than two decimal places and no greater than 999,999.99
2. IF a user submits a bid that is less than the current highest bid plus the minimum increment of £1, THEN THE Bidding_Module SHALL reject the bid and display an error message indicating the minimum required amount
3. IF a user submits a bid after the item end time has passed, THEN THE Bidding_Module SHALL reject the bid, display a message indicating the item has ended, and close the bidding interface
4. IF a user who is not signed in attempts to bid, THEN THE Bidding_Module SHALL display a message indicating the user must be logged in
5. IF a signed-in user who has not set a display name attempts to bid, THEN THE Bidding_Module SHALL display a message indicating a username is required and redirect the user to the Registration_Form
6. WHILE a bid submission is in progress, THE Bidding_Module SHALL disable the submit button to prevent duplicate submissions
7. WHEN a bid is successfully placed, THE Bidding_Module SHALL write the bid to Firestore with the user's UID and bid amount

### Requirement 4: Authentication Flow Improvements

**User Story:** As a user, I want a reliable and clear authentication experience, so that I can register, log in, and participate in the auction without confusion.

#### Acceptance Criteria

1. WHEN a user completes registration successfully, THE Auction_System SHALL automatically sign the user in, close the Registration_Form within 2 seconds, and update the navigation bar to show the authenticated state
2. WHEN a user attempts to bid without having completed registration (anonymous-only session), THE Bidding_Module SHALL open the Registration_Form and display a message indicating that registration is required before placing a bid
3. IF the Firebase authentication service returns an error during registration, THEN THE Registration_Form SHALL display the error message returned by Firebase to the user and preserve the entered email address in the form
4. IF the Firebase authentication service returns an error during login, THEN THE Auction_System SHALL display the error message returned by Firebase to the user and preserve the entered email address in the form
5. WHEN a signed-in user clicks "Sign out", THE Auction_System SHALL sign the user out and revert the navigation bar to display the "Login", "Sign up", and "Forgot Password" buttons
6. IF the sign-out operation fails, THEN THE Auction_System SHALL display an error message indicating that sign-out was unsuccessful

### Requirement 5: Real-Time Auction Display

**User Story:** As a bidder, I want to see live updates to bids and item status, so that I can make informed bidding decisions without refreshing the page.

#### Acceptance Criteria

1. WHEN a new bid is placed on any item, THE Auction_System SHALL update the displayed bid count and current amount within 2 seconds for all connected users viewing that item
2. WHILE an item's end time has not passed, THE Auction_System SHALL display a countdown timer that updates every second showing the remaining time in the format "Xd Xh Xm Xs" omitting zero-value leading units
3. WHEN an item's countdown reaches zero, THE Auction_System SHALL display "Item Ended" in place of the countdown timer
4. WHEN an item's countdown reaches zero and the highest bid meets or exceeds the reserve price, THE Auction_System SHALL display "Sold" as the item status
5. WHEN an item's countdown reaches zero and the highest bid is below the reserve price, THE Auction_System SHALL display "Reserve Not Met" as the item status
6. WHILE an item has zero bids, THE Auction_System SHALL display the starting price as the current amount and "0 bids" as the bid count
7. IF the real-time connection to the data source is lost, THEN THE Auction_System SHALL continue displaying the last received bid data and countdown timer based on the local clock until the connection is restored

### Requirement 6: Admin Item Management

**User Story:** As an administrator, I want to manage auction items including setting reserve prices, so that I can control the auction configuration.

#### Acceptance Criteria

1. WHEN an administrator clicks "Update All", THE Admin_Panel SHALL update all item details (title, subtitle, detail, images, currency, amount, and end time) from the items.yml configuration without removing existing bid history or reserve prices
2. WHEN an administrator clicks "Reset All", THE Admin_Panel SHALL remove all bid history for all items without modifying item details or reserve prices
3. THE Admin_Panel SHALL display each item's title, current highest bid, number of bids, winning user's display name, and reserve price in a table format
4. WHEN an administrator sets a reserve price for an item, THE Admin_Panel SHALL persist the reserve price as a numeric value between 0.00 and 999,999.99 (inclusive) to the Item_Document in Firestore
5. IF an administrator enters a non-numeric, negative, or value exceeding 999,999.99 as a reserve price, THEN THE Admin_Panel SHALL display a validation error indicating the accepted range and prevent submission
6. WHEN an administrator successfully completes an "Update All" or "Reset All" operation, THE Admin_Panel SHALL display a confirmation message indicating the operation completed
7. IF the items.yml configuration fails to load during an "Update All" operation, THEN THE Admin_Panel SHALL display an error message indicating the configuration could not be loaded and leave existing item data unchanged
8. IF an administrator sets a reserve price of 0.00 for an item, THEN THE Admin_Panel SHALL treat the item as having no reserve price requirement

### Requirement 7: Firebase Database Deployment

**User Story:** As a developer, I want Firestore security rules, indexes, and deployment configuration version-controlled in the repository, so that database changes are tracked, reviewable, and deployable through a consistent pipeline.

#### Acceptance Criteria

1. THE Auction_System repository SHALL contain a firestore.rules file (Firestore_Rules) at the project root that defines read and write access controls for all Firestore collections used by the application
2. THE Auction_System repository SHALL contain a firestore.indexes.json file (Firestore_Indexes) at the project root that defines all composite indexes required by Firestore queries in the application
3. THE Auction_System repository SHALL contain a Firebase_Config file (firebase.json) at the project root that references the Firestore_Rules and Firestore_Indexes files and configures the Firestore deployment target for the goostrey-ball-auction project
4. WHEN a developer runs the Firebase deploy command, THE Firebase_Config SHALL direct the Firebase CLI to deploy the Firestore_Rules and Firestore_Indexes to the goostrey-ball-auction Firebase project
5. THE Deployment_Pipeline SHALL include a step that deploys Firestore_Rules and Firestore_Indexes to the goostrey-ball-auction Firebase project when changes are pushed to the main branch
6. IF the Firestore_Rules file contains a syntax error, THEN THE Deployment_Pipeline SHALL fail the deployment step and report the error without applying changes to the live database
7. THE Auction_System repository SHALL contain a .firebaserc file at the project root that maps the default project alias to the goostrey-ball-auction Firebase project identifier
