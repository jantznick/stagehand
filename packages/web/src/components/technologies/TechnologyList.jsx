import React, { useMemo } from 'react';
import { X, Edit } from 'lucide-react';
import AddTechnologyForm from './AddTechnologyForm';

const TechnologyList = ({ 
    technologies, onRemove, onUpdate, onCancelEdit,
    editingGroupId, onEditGroup,
    onAddTechnology, addingVersionToGroupId, onSetAddingVersionToGroupId
}) => {

    const groupedTechnologies = useMemo(() => {
        if (!technologies) return {};
        return technologies.reduce((acc, techInstance) => {
            const { technology } = techInstance;
            if (!acc[technology.id]) {
                acc[technology.id] = {
                    ...technology,
                    instances: [],
                };
            }
            acc[technology.id].instances.push(techInstance);
            return acc;
        }, {});
    }, [technologies]);

    const sortedGroups = useMemo(() => {
        return Object.values(groupedTechnologies).sort((a, b) => a.name.localeCompare(b.name));
    }, [groupedTechnologies]);

    if (sortedGroups.length === 0) {
        return (
            <div className="text-center py-4 text-gray-400 border border-dashed border-gray-700 rounded-md">
                No technologies have been added yet.
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul role="list" className="divide-y divide-white/10">
                {sortedGroups.map((group) => {
                    const isGroupEditing = editingGroupId === group.id;
                    const versions = group.instances.map(inst => inst.version || 'N/A').join(', ');

                    return (
                        <li key={group.id} className="py-3">
                            {/* Collapsed View */}
                            {!isGroupEditing && (
                                <div className="flex items-center justify-between gap-x-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-x-3">
                                            <p className="text-base font-semibold leading-6 text-white">{group.name}</p>
                                            <span className="inline-flex items-center rounded-md bg-gray-400/10 px-2 py-1 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-400/20">
                                                {group.type}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-sm leading-5 text-gray-400">
                                            Versions: <span className="font-medium text-gray-300">{versions}</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-none items-center gap-x-4">
                                        <button onClick={() => onEditGroup(group.id)} className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-gray-700">
                                            <Edit className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Expanded/Editing View */}
                            {isGroupEditing && (
                                <div>
                                    <div className="flex items-center justify-between gap-x-6">
                                         <div className="flex items-center gap-x-3">
                                            <p className="text-base font-semibold leading-6 text-white">{group.name}</p>
                                             <span className="inline-flex items-center rounded-md bg-gray-400/10 px-2 py-1 text-xs font-medium text-gray-400 ring-1 ring-inset ring-gray-400/20">
                                                {group.type}
                                            </span>
                                        </div>
                                        <button onClick={onCancelEdit} className="text-xs rounded-md bg-gray-600 px-2 py-1 text-white hover:bg-gray-500">Done</button>
                                    </div>
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <h4 className="text-sm font-medium text-gray-300 mb-2">Edit versions in use</h4>
                                        <ul className="space-y-3">
                                            {group.instances.map(instance => (
                                                <li key={instance.id} className="pl-4 border-l-2 border-indigo-500">
                                                    <div className="flex items-center justify-between gap-x-4">
                                                        <div className="flex-grow">
                                                            <AddTechnologyForm
                                                                initialData={instance}
                                                                onUpdate={(data) => onUpdate(instance.id, data)}
                                                                isEditingInstance={true}
                                                            />
                                                        </div>
                                                        <div className="pr-2">
                                                            <button onClick={() => onRemove(instance.id)} className="p-1 text-gray-400 hover:text-red-500">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            {addingVersionToGroupId === group.id ? (
                                                <div className="pl-4 border-l-2 border-green-500">
                                                    <AddTechnologyForm
                                                        technologyToAddVersionTo={group}
                                                        onAddTechnology={onAddTechnology}
                                                        onCancel={() => onSetAddingVersionToGroupId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => onSetAddingVersionToGroupId(group.id)}
                                                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                                >
                                                    + Add another version
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};

export default TechnologyList; 