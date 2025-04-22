import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NavigationRail.module.css';

// TODO: Implement M3 Navigation Rail
// https://m3.material.io/components/navigation-rail/overview

// M3 Transition Values (reuse or define locally)
const m3EaseStandard = [0.4, 0.0, 0.2, 1];
const m3DurationMedium2 = 0.3; // 300ms

// Expects navItems prop: [{ to: string, icon: Component, label: string }]
function NavigationRail({ navItems = [] }) {
  return (
    <motion.nav className={styles.railContainer}>
      {navItems.map((item) => {
        const NavIcon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={item.label} // Add title for accessibility
          >
            {({ isActive }) => (
              <>
                {/* Active indicator - positioned by CSS */}
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="activeRailIndicator" // Unique layoutId for the rail
                    transition={{
                      duration: m3DurationMedium2,
                      ease: m3EaseStandard,
                    }}
                  />
                )}
                {/* Icon and Label */}
                <NavIcon className={styles.icon} />
                <span className={styles.label}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </motion.nav>
  );
}

export default NavigationRail; 