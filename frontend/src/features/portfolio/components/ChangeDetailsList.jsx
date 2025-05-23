import React from 'react';
import PropTypes from 'prop-types';
import ChangeItemCard from './ChangeItemCard'; // Component to render individual change details.

/**
 * @component ChangeDetailsList
 * @description Renders a list of planned financial changes for a portfolio.
 * Each change is displayed using the `ChangeItemCard` component.
 * This component handles the layout and iteration of changes, passing necessary data
 * and event handlers down to each card. It supports selection, editing, and deletion of changes.
 * It also integrates with a ref system (`itemRefs`) for potential scroll-to-item functionality
 * and uses an `assetIdToNameMap` to allow child components to display asset names.
 *
 * @example
 * const changes = [{id: '1', type: 'Contribution', amount: 100, date: '2024-01-01'}, ...];
 * const refs = useRef({});
 * const assetMap = {'asset_123': 'Apple Stock'};
 * <ChangeDetailsList
 *   displayedChanges={changes}
 *   selectedChangeId={'1'}
 *   onSelectChange={handleSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   itemRefs={refs}
 *   assetIdToNameMap={assetMap}
 * />
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} props.displayedChanges - An array of planned change objects to be displayed. Required.
 * @param {string|number|null} props.selectedChangeId - The ID of the currently selected change, if any.
 * @param {Function} props.onSelectChange - Callback function invoked when a change item is selected. Receives change ID. Required.
 * @param {Function} props.onEdit - Callback function invoked when the edit action for a change is triggered. Receives change object. Required.
 * @param {Function} props.onDelete - Callback function invoked when the delete action for a change is triggered. Receives change ID. Required.
 * @param {object} [props.itemRefs] - A React ref object, typically `useRef()`, whose `.current` property is expected to be an
 *                                    object mapping change IDs to their corresponding DOM element refs. Used for scrolling to specific items.
 * @param {object} props.assetIdToNameMap - An object mapping asset IDs to their display names. Required for `ChangeItemCard`.
 *
 * @returns {JSX.Element} The rendered list of change details or an empty state message.
 */
const ChangeDetailsList = ({
  displayedChanges,
  selectedChangeId,
  onSelectChange,
  onEdit,
  onDelete,
  itemRefs, // Ref object for DOM elements of individual change items.
  assetIdToNameMap, // Map of asset IDs to names, passed down to ChangeItemCard.
}) => {
  return (
    // Main container for the list, styled for layout within a grid, padding, shadow, and scrolling.
    // `maxHeight` style constrains its height, making it scrollable for long lists.
    <div
      className="md:col-span-2 bg-white p-4 rounded-lg shadow overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 250px)' }} // Example: Max height relative to viewport height.
    >
      {/* Title for the list, dynamically showing the count of displayed changes. */}
      <h3 className="text-md font-semibold text-gray-700 mb-3 pl-4">
        Change Details ({displayedChanges.length})
      </h3>
      {/* Conditional rendering: Show list if changes exist, otherwise show empty state message. */}
      {displayedChanges.length > 0 ? (
        <div className="space-y-3"> {/* Adds vertical spacing between change item cards. */}
          {/* Map over the `displayedChanges` array to render each change item. */}
          {displayedChanges.map(change => (
            // Wrapper div for each ChangeItemCard, incorporating the ref for scrolling.
            // The ref is accessed from itemRefs.current using the change's ID as the key.
            <div 
              key={change.id} 
              ref={itemRefs && itemRefs.current && itemRefs.current[change.id] ? itemRefs.current[change.id] : null}
            >
              <ChangeItemCard
                change={change} // The planned change object itself.
                isSelected={selectedChangeId === change.id} // Boolean indicating if this card is currently selected.
                onSelectChange={() => onSelectChange(change.id)} // Handler for selecting this card.
                onEdit={() => onEdit(change)} // Handler for editing this change.
                onDelete={() => onDelete(change.id)} // Handler for deleting this change.
                assetIdToNameMap={assetIdToNameMap} // Pass the asset ID to name map for displaying asset names.
              />
            </div>
          ))}
        </div>
      ) : (
        // Message displayed when no changes match the current filters or if there are no changes.
        <div className="text-sm text-gray-500 p-4 text-center">
          No planned changes match the current filters.
        </div>
      )}
    </div>
  );
};

// PropTypes for type-checking and component documentation.
ChangeDetailsList.propTypes = {
  /** 
   * An array of planned change objects to be displayed. 
   * Each object should at least contain an `id`. Other properties depend on `ChangeItemCard`.
   * Required. 
   */
  displayedChanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      // Example other properties that might be expected by ChangeItemCard:
      // type: PropTypes.string,
      // date: PropTypes.string,
      // amount: PropTypes.number,
      // description: PropTypes.string,
      // target_allocations: PropTypes.array,
    })
  ).isRequired,
  /** The ID of the currently selected change item. `null` or `undefined` if no item is selected. */
  selectedChangeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback function triggered when a change item is clicked/selected. Receives the ID of the selected change. Required. */
  onSelectChange: PropTypes.func.isRequired,
  /** Callback function triggered when the "Edit" action for a change item is initiated. Receives the full change object. Required. */
  onEdit: PropTypes.func.isRequired,
  /** Callback function triggered when the "Delete" action for a change item is initiated. Receives the ID of the change to be deleted. Required. */
  onDelete: PropTypes.func.isRequired,
  /** 
   * A React ref object (e.g., from `useRef()`). Its `.current` property is expected to be an object
   * mapping change IDs to their corresponding DOM element refs. This is used to enable
   * programmatic scrolling to a specific change item in the list. Optional.
   */
  itemRefs: PropTypes.shape({
    current: PropTypes.objectOf(PropTypes.any), // `any` is used as specific ref instance is hard to type with PropTypes.
                                                 // Ideally, `PropTypes.instanceOf(Element)` for values if structure was flat.
  }),
  /** 
   * An object mapping asset IDs (string or number) to their corresponding display names (string).
   * This is passed down to `ChangeItemCard` to resolve and display asset names, especially for reallocations. Required.
   */
  assetIdToNameMap: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default ChangeDetailsList;