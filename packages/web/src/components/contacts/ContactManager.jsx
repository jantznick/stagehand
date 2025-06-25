import React, { useState, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import AddContactForm from './AddContactForm';
import ContactList from './ContactList';

const ContactManager = ({ project }) => {
    const { 
        selectedItem, 
        fetchProjectMembers, 
        addContact, 
        removeContact, 
        projectMembers, 
        isLoadingMembers,
        updateContact,
    } = useHierarchyStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);

    useEffect(() => {
        if (project.id) {
            fetchProjectMembers(project.id);
        }
    }, [project.id, fetchProjectMembers]);

    const handleAddContact = async (values) => {
        await addContact(project.id, values);
        setIsAdding(false);
    };

    const handleUpdateContact = async (contactId, data) => {
        await updateContact(project.id, contactId, data);
        setEditingContactId(null);
    };

    const handleRemoveContact = (contactId, contactType) => {
        removeContact(project.id, contactId, contactType);
    };

    return (
        <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">
                    Points of Contact
                </h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                        Add Contact
                    </button>
                )}
            </div>
            
            <div className="mt-4 space-y-4">
                {isAdding && (
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                         <AddContactForm
                            onAddContact={handleAddContact}
                            onCancel={() => setIsAdding(false)}
                            members={projectMembers || []}
                            isLoading={isLoadingMembers}
                            existingContacts={selectedItem.contacts || []}
                        />
                    </div>
                )}
                <ContactList 
                    contacts={selectedItem.contacts || []} 
                    onRemove={handleRemoveContact}
                    onEdit={setEditingContactId}
                    editingContactId={editingContactId}
                    onUpdateContact={handleUpdateContact}
                    members={projectMembers || []}
                    existingContacts={selectedItem.contacts || []}
                />
            </div>
        </div>
    );
};

export default ContactManager; 