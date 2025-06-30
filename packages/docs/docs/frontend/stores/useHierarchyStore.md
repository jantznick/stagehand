# Store: `useHierarchyStore`

*   **File:** `packages/web/src/stores/useHierarchyStore.js`
*   **Purpose:** Manages the entire nested organizational hierarchy tree. This is the data source for the main navigation sidebar and is one of the most complex stores.

---

## State

*   `hierarchy`: An array of richly nested organization objects. This is the raw data for the entire navigation tree visible to the user.
*   `activeOrganization`: The organization object currently selected in the Organization switcher.
*   `activeCompany`: The company object currently selected in the Company switcher.
*   `selectedItem`: The specific item (org, company, team, or project) currently being viewed in the main content area (`DashboardPage`).
*   `isLoading`: A boolean flag for when the hierarchy is being fetched.

---

## Actions

### `fetchHierarchy()`
*   **Description:** Fetches the entire visible hierarchy for the current user. This is the main data loading action for the application's navigation.
*   **API Call:** `GET /api/v1/hierarchy`

### `addItem(item, parentId)`, `updateItem(item)`, `deleteItem(item)`
*   **Description:** A set of actions that use the Immer library to perform immutable updates on the nested `hierarchy` state.
*   **API Call:** None. These actions modify the local state only. They are called after a successful API call in another store (e.g., after `useTeamStore.createTeam` succeeds, it calls `useHierarchyStore.addItem` to add the new team to the navigation tree without a full re-fetch).

### `setActiveOrganization(organization)`
*   **Description:** Sets the `activeOrganization` and updates the `activeCompany` to the default company for that organization.
*   **API Call:** None.

### `setActiveCompany(company)`
*   **Description:** Sets the `activeCompany` and also sets it as the `selectedItem`.
*   **API Call:** None.

### `setSelectedItem(item)`
*   **Description:** Sets the `selectedItem`, which is used by the `DashboardPage` to determine what content to display.
*   **API Call:** None.

### `setActiveItemsFromUrl(pathname)`
*   **Description:** A helper action called by the router to synchronize the store's state with the browser's URL.
*   **Behavior:** It parses the URL (e.g., `/teams/123`) to find the corresponding item in the `hierarchy` state tree and sets the `activeOrganization`, `activeCompany`, and `selectedItem` accordingly. This enables deep linking.

### `updateHierarchyDisplayNames(organizationId, displayNames)`
*   **Description:** Allows an admin to customize the names for hierarchy levels (e.g., rename "Company" to "Business Unit").
*   **API Call:** `PUT /api/v1/organizations/:organizationId` 