import { useState, useEffect } from 'react';

// M3 Breakpoints reference (approximate):
// Compact: < 600dp
// Medium: 600dp - 839dp
// Expanded: >= 840dp

const getBreakpoint = (width) => {
  if (width < 600) {
    return 'small'; // Compact
  } else if (width < 840) {
    return 'medium'; // Medium
  } else {
    return 'large'; // Expanded
  }
};

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    // Check if window is defined (for SSR or testing environments)
    return typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'large';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
        return; // Don't run effect on server
    }

    const calcInnerWidth = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', calcInnerWidth);
    return () => window.removeEventListener('resize', calcInnerWidth);
  }, []);

  return breakpoint;
} 