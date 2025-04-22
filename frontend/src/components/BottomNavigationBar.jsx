import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './BottomNavigationBar.module.css';

// TODO: Implement M3 Navigation Bar (Bottom Nav)
// https://m3.material.io/components/navigation-bar/overview

// M3 Transition Values
const m3EaseStandard = [0.4, 0.0, 0.2, 1];
const m3DurationMedium2 = 0.3; // 300ms

// Expects navItems prop: [{ to: string, icon: Component, label: string }]
function BottomNavigationBar({ navItems = [] }) {
  return (
    <motion.nav className={styles.barContainer}>
      {navItems.map((item) => {
        const NavIcon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navDestination} ${isActive ? styles.active : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Container for the indicator pill to position it correctly */}
                <div className={styles.indicatorContainer}>
                  {isActive && (
                    <motion.div
                      className={styles.activeIndicator}
                      layoutId="activeBottomNavIndicator" // Unique layoutId for bottom nav
                      transition={{
                        duration: m3DurationMedium2,
                        ease: m3EaseStandard,
                      }}
                    />
                  )}
                </div>
                {/* Wrapper for icon and label to stack them */}
                <div className={styles.iconLabelWrapper}>
                    <NavIcon className={styles.icon} />
                    <span className={styles.label}>{item.label}</span>
                </div>
              </>
            )}
          </NavLink>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavigationBar; 