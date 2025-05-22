import React from 'react';
import PropTypes from 'prop-types';
import ChangeItemCard from './ChangeItemCard';

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
      <h3 className="text-md font-semibold text-gray-700 mb-3 pl-4">
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

ChangeDetailsList.propTypes = {
  displayedChanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      // Add other shape properties as needed based on the 'change' object structure
    })
  ).isRequired,
  selectedChangeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  itemRefs: PropTypes.shape({
    current: PropTypes.object, // Ideally, refine this if the structure is known
  }),
  assetIdToNameMap: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default ChangeDetailsList; 