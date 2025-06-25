import React, { useState, Fragment, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { useDebounce } from '../../hooks/useDebounce';
import { Check, ChevronsUpDown } from 'lucide-react';

const AddContactForm = ({ onAddContact, onCancel, members, isLoading, existingContacts, initialData }) => {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [customName, setCustomName] = useState(initialData?.name || '');
    const [query, setQuery] = useState(initialData?.email || '');
    const [role, setRole] = useState(initialData?.role || '');
    const [error, setError] = useState('');
    const debouncedQuery = useDebounce(query, 300);

    const isEditing = !!initialData;

    const existingEmails = new Set((existingContacts || [])
        .map(c => c.contact.email.toLowerCase())
        .filter(email => email !== initialData?.email.toLowerCase()) 
    );
    
    const emailToAdd = selectedPerson ? selectedPerson.email : query;
    const isDuplicate = emailToAdd && existingEmails.has(emailToAdd.toLowerCase());

    useEffect(() => {
        if (error) {
            setError('');
        }
    }, [emailToAdd]);

    const filteredMembers =
        debouncedQuery === ''
            ? members
            : members.filter((person) =>
                person.email.toLowerCase().includes(debouncedQuery.toLowerCase())
            );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isDuplicate) {
            setError('This contact already exists for this project.');
            return;
        }
        setError('');
        const contactData = {
            email: emailToAdd,
            name: customName,
            role: role,
        };
        onAddContact(contactData);
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex items-center gap-x-3">
                <div className={`relative flex-grow rounded-md ring-1 ring-inset ${isDuplicate ? 'ring-red-500' : 'ring-transparent'}`} style={{ flexBasis: '40%' }}>
                    <Combobox value={selectedPerson} onChange={(person) => {
                        setSelectedPerson(person);
                        setQuery(person ? person.email : '');
                    }} disabled={isEditing}>
                        <Combobox.Input
                            className="w-full rounded-md border-gray-600 bg-gray-900 text-white focus:ring-indigo-500 sm:text-sm p-2 disabled:bg-gray-700 disabled:cursor-not-allowed"
                            onChange={(event) => setQuery(event.target.value)}
                            displayValue={(person) => person ? person.email : query}
                            placeholder="Search or add email..."
                            id="contact-email"
                            disabled={isEditing}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {isLoading && <div className="relative cursor-default select-none py-2 px-4 text-gray-400">Loading...</div>}
                                 {!isLoading && filteredMembers.length === 0 && query !== '' ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                                        No user found. Type full email to add.
                                    </div>
                                ) : (
                                    filteredMembers.map((person) => (
                                        <Combobox.Option
                                            key={person.id}
                                            className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
                                            value={person}
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{person.email}</span>
                                                    {selected && (
                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                            <Check className="h-5 w-5" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </Combobox.Options>
                        </Transition>
                    </Combobox>
                </div>

                <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-grow rounded-md border-gray-600 bg-gray-900 text-white focus:ring-indigo-500 sm:text-sm p-2"
                    style={{ flexBasis: '40%' }}
                    placeholder="Full Name"
                    required
                />
                
                <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-grow rounded-md border-gray-600 bg-gray-900 text-white focus:ring-indigo-500 sm:text-sm p-2"
                    style={{ flexBasis: '20%' }}
                    placeholder="Role / Title"
                    required
                />

                <div className="flex items-center gap-x-2">
                    <button
                        type="submit"
                        className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-indigo-800 disabled:cursor-not-allowed"
                        disabled={!emailToAdd}
                    >
                        {isEditing ? 'Save' : 'Add'}
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
            {isDuplicate && <p className="text-sm text-red-500 mt-2">This contact already exists for this project.</p>}
        </div>
    );
};

export default AddContactForm; 