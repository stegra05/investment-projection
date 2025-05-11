import React from 'react';
import ChangeItemCard from './ChangeItemCard'; // Assuming ChangeItemCard is in the same directory

const ChangeDetailsList = ({
  displayedChanges,
  selectedChangeId,
  onSelectChange,
  onEdit,
  onDelete,
  itemRefs, // Pass itemRefs to attach to the div elements
  assetIdToNameMap, // Accept the new prop
}) => {
  return (
    <div
      className="md:col-span-2 bg-white p-4 rounded-lg shadow overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 250px)' }}
    >
      <h3 className="text-md font-semibold text-gray-700 mb-3">
        Change Details ({displayedChanges.length})
      </h3>
      {displayedChanges.length > 0 ? (
        <div className="space-y-3">
          {displayedChanges.map(change => (
            <div key={change.id} ref={itemRefs && itemRefs.current && itemRefs.current[change.id] ? itemRefs.current[change.id] : null}>
              <ChangeItemCard
                change={change}
                isSelected={selectedChangeId === change.id}
                onSelectChange={() => onSelectChange(change.id)}
                onEdit={() => onEdit(change)}
                onDelete={() => onDelete(change.id)}
                assetIdToNameMap={assetIdToNameMap} // Pass it to ChangeItemCard
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No planned changes match the current filters.
        </div>
      )}
    </div>
  );
};

export default ChangeDetailsList; 