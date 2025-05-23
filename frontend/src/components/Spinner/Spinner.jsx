import React from 'react';
import PropTypes from 'prop-types';

/**
 * @component Spinner
 * @description A simple, SVG-based spinning loader component used to indicate loading or processing states.
 * It is styled using Tailwind CSS classes, allowing for customization of size and color.
 * The animation (`animate-spin`) is provided by Tailwind CSS.
 *
 * @example
 * // Default spinner
 * <Spinner />
 *
 * // Larger, different color spinner
 * <Spinner size="h-10 w-10" color="text-red-500" />
 *
 * // Spinner with additional custom classes
 * <Spinner className="my-custom-spinner-styles" />
 *
 * @param {object} props - The component's props.
 * @param {string} [props.size='h-5 w-5'] - Tailwind CSS classes defining the height and width of the spinner.
 * @param {string} [props.color='text-primary-600'] - Tailwind CSS class defining the text color (which SVG `currentColor` inherits).
 * @param {string} [props.className=''] - Additional custom CSS classes to apply to the SVG element.
 *
 * @returns {JSX.Element} The rendered SVG spinner component.
 */
const Spinner = ({ size = 'h-5 w-5', color = 'text-primary-600', className = '' }) => {
  return (
    <svg
      // Combines Tailwind's spin animation with size, color, and any custom classes.
      className={`animate-spin ${size} ${color} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none" // The spinner is typically drawn with strokes or partial fills, not a full fill.
      viewBox="0 0 24 24" // Standard SVG viewbox.
      // Accessibility: Hide from screen readers if it's purely decorative or if
      // loading state is already conveyed by text (e.g., "Loading...").
      aria-hidden="true" 
    >
      {/* Background track for the spinner (the lighter part of the circle). */}
      <circle
        className="opacity-25" // Makes this part of the circle semi-transparent.
        cx="12" // Center x-coordinate.
        cy="12" // Center y-coordinate.
        r="10"  // Radius of the circle.
        stroke="currentColor" // Stroke color inherits from the SVG's text color.
        strokeWidth="4"       // Width of the stroke.
      ></circle>
      {/* The moving part of the spinner (the more opaque arc). */}
      <path
        className="opacity-75" // Makes this part more opaque.
        fill="currentColor"   // Fill color inherits from the SVG's text color.
        // Defines the shape of the arc. This specific path creates a partial circle.
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

// PropTypes for type-checking and component documentation.
Spinner.propTypes = {
  /** Tailwind CSS classes for the size of the spinner (e.g., 'h-8 w-8'). */
  size: PropTypes.string,
  /** Tailwind CSS class for the color of the spinner (e.g., 'text-blue-500'). Relies on `currentColor` in SVG. */
  color: PropTypes.string,
  /** Additional CSS classes to be applied to the spinner's SVG element for further customization. */
  className: PropTypes.string,
};

export default Spinner;