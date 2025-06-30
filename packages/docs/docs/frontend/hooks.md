# Frontend Documentation: Custom Hooks

This document provides a breakdown of the custom React hooks used throughout the application.

## Overview

Custom hooks are reusable functions that encapsulate component logic. They allow us to share stateful logic between different components without repeating code.

---

## `useDebounce`

*   **File:** `packages/web/src/hooks/useDebounce.js`
*   **Purpose:** To debounce a rapidly changing value. This is primarily used to delay an action (like an API call) until the user has stopped typing for a specified period.

### Usage

```jsx
import { useDebounce } from '../hooks/useDebounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // The debouncedSearchTerm will only update 500ms after the user stops typing
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // This effect will run only when debouncedSearchTerm changes
    if (debouncedSearchTerm) {
      // Perform the API call with the debounced term
      searchApi(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input 
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
```

### Parameters

*   `value` (any): The value to be debounced (e.g., the `searchTerm` from state).
*   `delay` (number): The debounce delay in milliseconds.

### Returns

*   `(any)`: The debounced value, which will be updated only after the specified `delay` has passed without the input `value` changing. 