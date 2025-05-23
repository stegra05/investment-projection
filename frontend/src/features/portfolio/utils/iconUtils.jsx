import React from 'react';
import {
  FaMoneyBillWave, // Icon for contributions/withdrawals.
  FaRandom,        // Icon for reallocations.
  FaInfoCircle,    // Default/fallback icon.
} from 'react-icons/fa'; // Importing specific icons from Font Awesome via react-icons.

/**
 * @file iconUtils.jsx
 * @description This file centralizes utility functions for retrieving and customizing icons
 * used within the portfolio feature of the application. This promotes consistency in icon usage
 * and makes it easier to update or change icons across related components.
 */

/**
 * Returns a specific React icon component based on the provided planned financial change type.
 * The icons are styled with Tailwind CSS classes for color and margin.
 *
 * @function getChangeTypeIcon
 * @param {string} changeType - The type of the planned financial change.
 *                              Expected values include 'CONTRIBUTION', 'WITHDRAWAL', 'REALLOCATION'.
 * @returns {JSX.Element} A React icon component (JSX Element) from `react-icons/fa`
 *                        styled with appropriate Tailwind CSS classes. Returns a default
 *                        info icon if the `changeType` is not recognized.
 * @example
 * // To get an icon for a contribution:
 * const contributionIcon = getChangeTypeIcon('CONTRIBUTION');
 * // Renders: <FaMoneyBillWave className="text-green-500 mr-2" />
 *
 * // To get an icon for an unknown type:
 * const unknownIcon = getChangeTypeIcon('UNKNOWN_TYPE');
 * // Renders: <FaInfoCircle className="text-gray-500 mr-2" />
 */
const getChangeTypeIcon = changeType => {
  switch (changeType) {
    case 'CONTRIBUTION':
      // Green money wave icon for contributions (positive financial impact).
      return <FaMoneyBillWave className="text-green-500 mr-2 h-5 w-5" />; // Added h-5 w-5 for consistent sizing
    case 'WITHDRAWAL':
      // Red money wave icon for withdrawals (negative financial impact).
      return <FaMoneyBillWave className="text-red-500 mr-2 h-5 w-5" />;
    case 'REALLOCATION':
      // Blue random/shuffle icon for reallocations (change in asset distribution).
      return <FaRandom className="text-blue-500 mr-2 h-5 w-5" />;
    default:
      // Default gray info icon for unknown or unspecified change types.
      return <FaInfoCircle className="text-gray-500 mr-2 h-5 w-5" />;
  }
};

export { getChangeTypeIcon };