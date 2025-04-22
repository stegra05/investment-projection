import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import portfolioService from '../services/portfolioService'; // Need service for saving

// --- Helper function for rounding ---
const roundToTwoDecimals = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export function useAllocationManagement(portfolioId, initialAssets, refetchPortfolio) {
  // State for allocation percentages: { [asset_id]: percentage, ... }
  const [currentAllocations, setCurrentAllocations] = useState({});
  // State to track if allocations have changed and need saving
  const [allocationsChanged, setAllocationsChanged] = useState(false);
  // Loading state for save button
  const [isSavingAllocations, setIsSavingAllocations] = useState(false);

  // Effect to initialize/reset currentAllocations when initialAssets data loads or changes
  useEffect(() => {
    if (initialAssets && Array.isArray(initialAssets)) {
      const initialAllocations = initialAssets.reduce((acc, asset) => {
        const initialPercent = parseFloat(asset.allocation_percentage);
        acc[asset.id] = isNaN(initialPercent) ? 0 : initialPercent;
        return acc;
      }, {});

      // --- Refined Normalization Logic (kept from original component) ---
      const numAssets = initialAssets.length;
      if (numAssets > 0) {
        let currentSum = Object.values(initialAllocations).reduce((sum, val) => sum + (Number(val) || 0), 0);
        let remainingDiff = 100 - currentSum;

        if (Math.abs(remainingDiff) > 0.01) {
          if (numAssets === 1) {
            const onlyAssetId = initialAssets[0].id;
            initialAllocations[onlyAssetId] = 100.00;
            console.log("Single asset detected, setting initial allocation to 100%");
          }
        }
      }
      // --- End Refined Normalization ---

      const numericAllocations = Object.entries(initialAllocations).reduce((acc, [key, value]) => {
        acc[key] = Number(value) || 0;
        return acc;
      }, {});

      setCurrentAllocations(numericAllocations);
      setAllocationsChanged(false); // Reset changed state on load/reset
    } else {
      setCurrentAllocations({}); // Reset if no assets
      setAllocationsChanged(false);
    }
  }, [initialAssets]); // Depend on the initial assets data

  // --- Allocation Adjustment Logic ---
  const handleAllocationChange = useCallback((changedAssetId, newPercentageStr) => {
    const newPercentage = parseFloat(newPercentageStr);
    if (isNaN(newPercentage)) {
      console.warn("Invalid allocation percentage input (NaN):", newPercentageStr);
      return; // Ignore invalid input
    }
    const clampedNewPercentage = roundToTwoDecimals(Math.max(0, Math.min(100, newPercentage)));
    const stringChangedAssetId = String(changedAssetId);

    setCurrentAllocations(prevAllocations => {
      const updatedAllocations = {
        ...prevAllocations,
        [stringChangedAssetId]: clampedNewPercentage,
      };
      setAllocationsChanged(true);
      return updatedAllocations;
    });
  }, []); // No external dependencies needed here

  // --- Calculate Total Current Allocation ---
  const totalCurrentAllocation = useMemo(() => {
    return roundToTwoDecimals(Object.values(currentAllocations).reduce((sum, p) => sum + (Number(p) || 0), 0));
  }, [currentAllocations]);

  // --- Handler for Saving Allocations ---
  const handleSaveAllocations = useCallback(async () => {
    setIsSavingAllocations(true);
    try {
      const allocationPayload = Object.entries(currentAllocations).map(([id, allocation_percentage]) => ({
        asset_id: parseInt(id, 10),
        allocation_percentage: allocation_percentage
      }));
      const payload = { allocations: allocationPayload };

      await portfolioService.updateAllocations(portfolioId, payload);

      setAllocationsChanged(false);
      // Use the passed refetch function
      if (refetchPortfolio) {
        await refetchPortfolio();
      }
      toast.success('Allocations saved successfully!');
    } catch (err) {
      console.error("Failed to save allocations:", err);
      const message = err.response?.data?.message || 'Failed to save allocations.';
      toast.error(message);
    } finally {
      setIsSavingAllocations(false);
    }
  }, [portfolioId, currentAllocations, refetchPortfolio]); // Dependencies for the save function

  return {
    currentAllocations,
    totalCurrentAllocation,
    allocationsChanged,
    isSavingAllocations,
    handleAllocationChange,
    handleSaveAllocations,
  };
} 