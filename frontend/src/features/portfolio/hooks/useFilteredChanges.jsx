import React, { useState, useEffect, useRef } from 'react';

/**
 * @hook useFilteredChanges
 * @description A custom React hook that filters a portfolio's planned changes based on specified criteria.
 * It takes the full portfolio object (containing planned changes), a filters object, and loading/error states
 * as input. It returns an array of `displayedChanges` that match the filters and an `itemRefs` object
 * which stores React refs for each displayed change item (useful for scrolling to specific items).
 * The filtering logic is re-run whenever the portfolio data, filters, or loading/error states change.
 *
 * @param {object|null} portfolio - The portfolio object, which should contain a `planned_changes` array.
 *                                  Can be null if data is not yet loaded or an error occurred.
 * @param {object} filters - An object containing the filter criteria. Expected properties:
 *                           `type` (string): Filter by change type (e.g., 'Contribution').
 *                           `startDate` (string): Filter for changes on or after this date (YYYY-MM-DD).
 *                           `endDate` (string): Filter for changes on or before this date (YYYY-MM-DD).
 *                           `description` (string): Text to search within change descriptions (case-insensitive).
 * @param {boolean} isPortfolioLoading - Boolean indicating if the portfolio data is currently being loaded.
 * @param {object|null} portfolioError - An error object if fetching the portfolio data failed, otherwise null.
 *
 * @returns {object} An object containing:
 *  - `displayedChanges` (Array<object>): An array of planned change objects that match the current filter criteria.
 *  - `itemRefs` (React.RefObject): A React ref object whose `.current` property holds an object mapping
 *                                   change IDs to their corresponding React refs (created using `React.createRef()`).
 */
const useFilteredChanges = (portfolio, filters, isPortfolioLoading, portfolioError) => {
  // State to hold the array of planned changes that match the current filters.
  const [displayedChanges, setDisplayedChanges] = useState([]);
  // Ref to store an object mapping change IDs to React refs for each displayed item.
  // This allows parent components to, for example, scroll a specific item into view.
  const itemRefs = useRef({}); 

  // useEffect hook to perform filtering whenever relevant data or filters change.
  useEffect(() => {
    // Only proceed with filtering if portfolio data is available and contains planned_changes.
    if (portfolio && portfolio.planned_changes) {
      // Start with a copy of all planned changes from the portfolio.
      let filteredChanges = [...portfolio.planned_changes];

      // Apply 'type' filter if a type is specified in filters.
      if (filters.type) {
        filteredChanges = filteredChanges.filter(change => change.change_type === filters.type);
      }

      // Apply 'startDate' filter if specified.
      // Changes on or after the startDate are kept. Dates are compared as Date objects.
      if (filters.startDate) {
        const startDateFilter = new Date(filters.startDate);
        // Adjust for timezone issues by comparing dates without time parts
        startDateFilter.setUTCHours(0, 0, 0, 0); 
        filteredChanges = filteredChanges.filter(change => {
            const changeDate = new Date(change.change_date);
            changeDate.setUTCHours(0,0,0,0);
            return changeDate >= startDateFilter;
        });
      }
      
      // Apply 'endDate' filter if specified.
      // Changes on or before the endDate are kept. Dates are compared as Date objects.
      if (filters.endDate) {
        const endDateFilter = new Date(filters.endDate);
        endDateFilter.setUTCHours(0,0,0,0);
        filteredChanges = filteredChanges.filter(change => {
            const changeDate = new Date(change.change_date);
            changeDate.setUTCHours(0,0,0,0);
            return changeDate <= endDateFilter;
        });
      }

      // Apply 'description' filter if specified.
      // Performs a case-insensitive search for the searchTerm within the change's description.
      if (filters.description) {
        const searchTerm = filters.description.toLowerCase();
        filteredChanges = filteredChanges.filter(
          change => change.description && change.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Update the state with the filtered list of changes.
      setDisplayedChanges(filteredChanges);

      // Regenerate itemRefs for the newly filtered list.
      // This creates a new ref for each change ID in the displayedChanges array.
      itemRefs.current = filteredChanges.reduce((acc, change) => {
        acc[change.id] = React.createRef(); // Create a new ref for each item.
        return acc;
      }, {});
    } else if (!isPortfolioLoading && !portfolioError) {
      // If portfolio data is not available (and not loading, and no error occurred),
      // or if `portfolio.planned_changes` is missing, reset displayedChanges and itemRefs.
      // This handles cases like an empty portfolio or initial state before data load.
      setDisplayedChanges([]);
      itemRefs.current = {};
    }
    // Dependencies for the useEffect hook: re-run filtering if any of these change.
  }, [portfolio, filters, isPortfolioLoading, portfolioError]);

  // Return the filtered changes and the refs object for use by the consuming component.
  return { displayedChanges, itemRefs };
};

export default useFilteredChanges;