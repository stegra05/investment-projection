import React from 'react';
import PropTypes from 'prop-types';

const SkeletonLoader = ({ className = 'h-4 bg-gray-200 dark:bg-gray-700 rounded w-full' }) => {
  return (
    <div className={`animate-pulse ${className}`}></div>
  );
};

SkeletonLoader.propTypes = {
  className: PropTypes.string,
};

export default SkeletonLoader; 