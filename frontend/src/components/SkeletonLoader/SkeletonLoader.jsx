import React from 'react';
import PropTypes from 'prop-types';

/**
 * @component SkeletonLoader
 * @description A simple, reusable component for displaying a skeleton loading placeholder.
 * It's used to indicate that content is loading, improving the user experience by providing
 * a visual cue that mimics the structure of the content to come.
 * Features a pulsing animation and is styled using Tailwind CSS classes, which can be customized.
 *
 * @example
 * // Default skeleton (thin line)
 * <SkeletonLoader />
 *
 * // Custom skeleton for a card or larger block
 * <SkeletonLoader className="h-32 bg-gray-300 dark:bg-gray-600 rounded-lg w-full" />
 *
 * // Skeleton for a circle (e.g., avatar)
 * <SkeletonLoader className="h-12 w-12 bg-gray-300 rounded-full" />
 *
 * @param {object} props - The component's props.
 * @param {string} [props.className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'] - Tailwind CSS classes to define the
 * appearance (height, width, background color, shape, etc.) of the skeleton element.
 * Defaults to a thin, full-width line.
 *
 * @returns {JSX.Element} The rendered skeleton loader div.
 */
const SkeletonLoader = ({ className = 'h-4 bg-gray-200 dark:bg-gray-700 rounded w-full' }) => {
  return (
    // The `animate-pulse` class from Tailwind CSS provides the pulsing animation.
    // The `className` prop allows for customization of the skeleton's dimensions, color, and shape.
    <div className={`animate-pulse ${className}`}></div>
  );
};

// PropTypes for type-checking and component documentation.
SkeletonLoader.propTypes = {
  /** 
   * A string of Tailwind CSS classes that define the skeleton item's dimensions,
   * background color, border-radius, and any other visual properties.
   * This allows for flexible creation of various skeleton shapes (lines, circles, blocks).
   */
  className: PropTypes.string,
};

export default SkeletonLoader;