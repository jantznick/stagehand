import React, { useState, Fragment, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { useDebounce } from '../../hooks/useDebounce';
import { Check, ChevronsUpDown } from 'lucide-react';
import { TECHNOLOGY_TYPES } from '../../lib/constants';

const AddTechnologyForm = ({ 
    onAddTechnology, 
    onCancel, 
    onUpdate, 
    initialData, 
    isEditingInstance,
    technologyToAddVersionTo 
}) => {
    const isEditing = !!initialData;
    const isAddingVersion = !!technologyToAddVersionTo;

    const [version, setVersion] = useState(initialData?.version || '');
    // For adding a new technology
    const [query, setQuery] = useState('');
    const [selectedTech, setSelectedTech] = useState(null);
    const [type, setType] = useState(TECHNOLOGY_TYPES[0]);
    
    // Update type when selectedTech changes, but allow user to override it
    useEffect(() => {
        if (selectedTech && selectedTech.type) {
            setType(selectedTech.type);
        }
    }, [selectedTech]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (debouncedQuery) {
            setIsLoading(true);
            fetch(`/api/v1/technologies?search=${debouncedQuery}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to search technologies", err);
                    setIsLoading(false);
                });
        } else {
            setSearchResults([]);
        }
    }, [debouncedQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isAddingVersion) {
            onAddTechnology({
                technologyId: technologyToAddVersionTo.id,
                version: version,
                source: 'user-entered',
            });
            setVersion(''); // Clear version
        } else if (isEditing) {
            onUpdate({ version });
        } else {
            const techName = selectedTech ? selectedTech.name : query;
            if (techName) {
                onAddTechnology({ 
                    name: techName, 
                    type: type, 
                    version: version, 
                    source: 'user-entered'
                });
            }
        }
    };

    if (isAddingVersion) {
        return (
             <form onSubmit={handleSubmit} className="flex items-center gap-x-3 w-full">
                <div className="flex-grow">
                    <p className="text-sm text-gray-400">
                        Adding version to <span className="font-semibold text-white">{technologyToAddVersionTo.name}</span>
                    </p>
                </div>
                 <input
                    type="text"
                    name="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="New version number"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
                 <div className="flex items-center gap-x-2">
                    <button
                        type="submit"
                        className="p-2 rounded-md bg-green-600 hover:bg-green-500 text-white disabled:bg-green-800 disabled:cursor-not-allowed"
                        disabled={!version}
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-x-3 w-full">
            {isEditingInstance ? (
                <input
                    type="text"
                    name="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Version (e.g., 18.2.0)"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                />
            ) : (
                <>
                    <div className="relative basis-1/2">
                        <Combobox value={selectedTech} onChange={setSelectedTech} disabled={isEditing}>
                            <Combobox.Input
                                className="w-full rounded-md border-0 bg-white/5 py-1.5 pl-3 pr-8 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                                onChange={(event) => setQuery(event.target.value)}
                                displayValue={(tech) => tech ? tech.name : query}
                                placeholder="Technology name..."
                                autoComplete='off'
                                disabled={isEditing}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                                <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </Combobox.Button>
                            <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setSearchResults([])}
                            >
                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {isLoading && <div className="relative cursor-default select-none py-2 px-4 text-gray-400">Loading...</div>}
                                    {!isLoading && searchResults.length === 0 && query !== '' ? (
                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                                            Nothing found. Type to create a new technology.
                                        </div>
                                    ) : (
                                        searchResults.map((tech) => (
                                            <Combobox.Option
                                                key={tech.id}
                                                className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                                                value={tech}
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{tech.name}</span>
                                                        {selected ? (
                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                                <Check className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))
                                    )}
                                </Combobox.Options>
                            </Transition>
                        </Combobox>
                    </div>
                    <div className="basis-1/4 relative">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className={`block w-full rounded-md border-0 bg-white/5 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 ${
                                selectedTech && selectedTech.type !== type ? 'ring-orange-500/50' : ''
                            }`}
                        >
                            {TECHNOLOGY_TYPES.map((t) => (
                                <option key={t} value={t} className="bg-gray-800 text-white">
                                    {t}
                                </option>
                            ))}
                        </select>
                        {selectedTech && selectedTech.type !== type && (
                            <p className="text-xs text-orange-400 mt-1">
                                Overriding suggested type: {selectedTech.type}
                            </p>
                        )}
                    </div>
                    <input
                        type="text"
                        name="version"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="Version"
                        className="block basis-1/4 rounded-md border-0 bg-white/5 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                    />
                </>
            )}

            <div className="flex items-center gap-x-2">
                <button
                    type="submit"
                    className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    disabled={isEditing ? !version : !(query || selectedTech)}
                >
                    {isEditing ? 'Save' : 'Add'}
                </button>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default AddTechnologyForm; 