import React, { useState } from 'react';
import { usePortfolio } from '../state/PortfolioContext';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import Button from '../../components/Button/Button';

// Define options based on AssetType enum (ideally fetched or centrally managed)
const assetTypeOptions = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'BOND', label: 'Bond' },
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' },
  { value: 'ETF', label: 'ETF' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CRYPTOCURRENCY', label: 'Cryptocurrency' },
  { value: 'OPTIONS', label: 'Options' },
  { value: 'OTHER', label: 'Other' }
];

function AssetsView() {
  const { portfolio } = usePortfolio();

  // Task 7: Implement Form State
  const [assetType, setAssetType] = useState('');
  const [nameOrTicker, setNameOrTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('');
  const [manualExpectedReturn, setManualExpectedReturn] = useState('');

  // Generic change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'assetType':
        setAssetType(value);
        break;
      case 'nameOrTicker':
        setNameOrTicker(value);
        break;
      case 'allocationPercentage':
        setAllocationPercentage(value);
        break;
      case 'manualExpectedReturn':
        setManualExpectedReturn(value);
        break;
      default:
        break;
    }
  };

  if (!portfolio) {
    return <div>Loading portfolio data or portfolio not selected...</div>;
  }

  // TODO: Task 8 - Add handleSubmit function
  // TODO: Task 11 - Add error state and display
  // TODO: Task 9 - Add isAdding state

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assets for {portfolio.name}</h2>
      
      {/* Task 4: Display existing assets here */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-medium mb-2">Existing Assets</h3>
        {/* Replace with actual list rendering based on portfolio.assets */}
        {portfolio.assets && portfolio.assets.length > 0 ? (
          <p>List of assets will go here.</p> // Placeholder for list/table
        ) : (
          <p className="text-gray-500 italic">No assets added yet.</p> // Empty state
        )}
      </div>

      {/* Task 6: Add Asset Form */}
      <div>
        <h3 className="text-lg font-medium mb-3">Add New Asset</h3>
        {/* TODO: Add onSubmit={handleSubmit} to form */}
        <form className="space-y-4">
          <Select
            label="Asset Type"
            id="assetType"
            name="assetType"
            value={assetType}
            onChange={handleInputChange}
            options={assetTypeOptions}
            required
            placeholder="Select asset type..."
          />
          <Input
            label="Name / Ticker"
            id="nameOrTicker"
            name="nameOrTicker"
            value={nameOrTicker}
            onChange={handleInputChange}
            required
            placeholder="e.g., Apple Inc. or AAPL"
          />
          <Input
            label="Allocation Percentage"
            id="allocationPercentage"
            name="allocationPercentage"
            type="number"
            value={allocationPercentage}
            onChange={handleInputChange}
            required
            placeholder="e.g., 25"
            min="0"
            max="100"
            step="0.01"
          />
          <Input
            label="Manual Expected Return (%)"
            id="manualExpectedReturn"
            name="manualExpectedReturn"
            type="number"
            value={manualExpectedReturn}
            onChange={handleInputChange}
            placeholder="Optional, e.g., 8.5"
            step="0.01"
            helperText="Leave blank to use default market estimates (if available)."
          />
          
          {/* TODO: Display addError state here (Task 11) */}

          <Button 
            type="submit" 
            variant="primary"
            // disabled={isAdding} // Connect to state in Task 9
          >
            {/* {isAdding ? 'Adding...' : 'Add Asset'} // Connect to state in Task 9 */}
            Add Asset 
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AssetsView; 