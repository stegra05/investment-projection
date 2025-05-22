import React, { useState, useEffect, useRef } from 'react';

const useFilteredChanges = (portfolio, filters, isPortfolioLoading, portfolioError) => {
  const [displayedChanges, setDisplayedChanges] = useState([]);
  const itemRefs = useRef({}); // Keep itemRefs logic within the hook

  useEffect(() => {
    if (portfolio && portfolio.planned_changes) {
      let filteredChanges = [...portfolio.planned_changes];

      // Apply type filter
      if (filters.type) {
        filteredChanges = filteredChanges.filter(change => change.change_type === filters.type);
      }

      // Apply date filters
      if (filters.startDate) {
        filteredChanges = filteredChanges.filter(
          change => new Date(change.change_date) >= new Date(filters.startDate)
        );
      }
      if (filters.endDate) {
        filteredChanges = filteredChanges.filter(
          change => new Date(change.change_date) <= new Date(filters.endDate)
        );
      }

      // Apply description filter
      if (filters.description) {
        const searchTerm = filters.description.toLowerCase();
        filteredChanges = filteredChanges.filter(
          change => change.description && change.description.toLowerCase().includes(searchTerm)
        );
      }
      setDisplayedChanges(filteredChanges);

      // Update itemRefs when displayedChanges update
      itemRefs.current = filteredChanges.reduce((acc, change) => {
        acc[change.id] = React.createRef();
        return acc;
      }, {});
    } else if (!isPortfolioLoading && !portfolioError) {
      setDisplayedChanges([]);
      itemRefs.current = {};
    }
  }, [portfolio, filters, isPortfolioLoading, portfolioError]);

  return { displayedChanges, itemRefs };
};

export default useFilteredChanges; 