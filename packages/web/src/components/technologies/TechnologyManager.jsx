import React, { useState } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import AddTechnologyForm from './AddTechnologyForm';
import TechnologyList from './TechnologyList';

const TechnologyManager = ({ project }) => {
    // These will be implemented in the store in the next step
    const { 
        selectedItem,
        addTechnology, 
        removeTechnology,
        updateTechnology,
    } = useHierarchyStore();

    const [isAdding, setIsAdding] = useState(false);
    // This will now store the technology.id of the *group* being expanded
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [addingVersionToGroupId, setAddingVersionToGroupId] = useState(null);

    const handleAddTechnology = async (values) => {
        await addTechnology(project.id, values);
        // Hide the forms after successful submission
        if (values.technologyId) { // This indicates it was an "add version" call
            setAddingVersionToGroupId(null);
        } else {
            setIsAdding(false);
        }
    };

    const handleUpdateTechnology = async (projectTechnologyId, data) => {
        // No need to change state here, the form will just save
        await updateTechnology(project.id, projectTechnologyId, data);
    };

    const handleRemoveTechnology = (projectTechnologyId) => {
        removeTechnology(project.id, projectTechnologyId);
		setIsAdding(false);
		setEditingGroupId(null);
		setAddingVersionToGroupId(null);
    };
    
    // When a user clicks 'Edit' on a group, we expand it.
    const handleEditGroup = (technologyId) => {
        setEditingGroupId(technologyId);
        // Ensure other forms are closed when entering edit mode
        setIsAdding(false);
        setAddingVersionToGroupId(null);
    };
    
    const handleCancelEdit = () => {
        setEditingGroupId(null);
        setAddingVersionToGroupId(null);
    };

    const handleBeginAddTechnology = () => {
        setIsAdding(true);
        // Ensure other forms are closed
        setEditingGroupId(null);
        setAddingVersionToGroupId(null);
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">
                    Technology Stack
                </h3>
				{!isAdding && !editingGroupId && (
                     <button
                        onClick={handleBeginAddTechnology}
                        className="px-3 py-1 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                        Add Technology
                    </button>
				)}
            </div>
            
            <div className="mt-4 space-y-4">
                {isAdding && (
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                         <AddTechnologyForm
                            onAddTechnology={handleAddTechnology}
                            onCancel={() => setIsAdding(false)}
                        />
                    </div>
                )}
                <TechnologyList 
                    technologies={selectedItem.technologies || []} 
                    onRemove={handleRemoveTechnology}
                    editingGroupId={editingGroupId}
                    onEditGroup={handleEditGroup}
                    onUpdate={handleUpdateTechnology}
                    onCancelEdit={handleCancelEdit}
                    onAddTechnology={handleAddTechnology}
                    addingVersionToGroupId={addingVersionToGroupId}
                    onSetAddingVersionToGroupId={setAddingVersionToGroupId}
                />
            </div>
        </div>
    );
};

export default TechnologyManager; 