import React, { useState } from 'react';
import { User, Mail, Briefcase, X, Edit, Send, UserPlus, ShieldCheck } from 'lucide-react';
import AddContactForm from './AddContactForm';
import useHierarchyStore from '../../stores/useHierarchyStore';

const ContactList = ({ contacts, onRemove, onEdit, editingContactId, onUpdateContact, members, existingContacts }) => {
    const { inviteOrGrantAccess } = useHierarchyStore();
    const [grantingAccessTo, setGrantingAccessTo] = useState(null);
    const [selectedRole, setSelectedRole] = useState('READER');

    if (!contacts || contacts.length === 0) {
        return (
            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-400">No contacts have been added to this application yet.</p>
            </div>
        );
    }
    
    const handleGrantAccess = async (contact) => {
        await inviteOrGrantAccess(contact.projectId, contact.contact.email, selectedRole);
        setGrantingAccessTo(null);
    };

    const renderActionButton = (projectContact) => {
        const { contact, user, projectMembership } = projectContact;
        const key = `${contact.id}-${projectContact.contactType}`;

        if (grantingAccessTo === key) {
             return (
                <div className="flex items-center gap-x-2">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-gray-700 text-white text-xs rounded-md p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="READER">Reader</option>
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <button onClick={() => handleGrantAccess(projectContact)} className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs">Confirm</button>
                    <button onClick={() => setGrantingAccessTo(null)} className="p-1.5 rounded-md bg-gray-600 hover:bg-gray-500 text-white text-xs">Cancel</button>
                </div>
            );
        }

        if (user && projectMembership) {
            return <div className="flex items-center gap-x-2 text-xs text-green-400"><ShieldCheck size={14} /> {projectMembership.role} Access</div>;
        }
        if (user && !projectMembership) {
            return <button onClick={() => setGrantingAccessTo(key)} className="flex items-center gap-x-1.5 px-2 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs"><UserPlus size={14}/> Grant Access</button>;
        }
        if (!user) {
            return <button onClick={() => handleGrantAccess(projectContact)} className="flex items-center gap-x-1.5 px-2 py-1.5 rounded-md bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs"><Send size={14}/> Invite</button>;
        }
        return null;
    };

    return (
        <div className="space-y-3">
            {contacts.map((projectContact) => {
                const { contact, contactType, user } = projectContact;
                const isEditing = editingContactId === `${contact.id}-${contactType}`;

                if (isEditing) {
                    return (
                        <div key={`${contact.id}-${contactType}`} className="p-4 bg-gray-800/50 rounded-lg">
                            <AddContactForm
                                onCancel={() => onEdit(null)}
                                onAddContact={(newData) => {
                                    const updateData = {
                                        name: newData.name,
                                        oldContactType: contactType,
                                        newContactType: newData.role
                                    };
                                    onUpdateContact(contact.id, updateData);
                                }}
                                initialData={{ name: contact.name, email: contact.email, role: contactType }}
                                members={members}
                                existingContacts={existingContacts}
                            />
                        </div>
                    );
                }

                return (
                    <div key={`${contact.id}-${contactType}`} className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-700 p-2 rounded-full relative">
                                <User className="text-gray-300" size={20} />
                                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-gray-800 ${user ? 'bg-green-400' : 'bg-gray-500'}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-white">{contact.name}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                    <span className="flex items-center"><Mail size={14} className="mr-1.5" />{contact.email}</span>
                                    <span className="flex items-center"><Briefcase size={14} className="mr-1.5" />{contactType}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="min-w-[120px] flex justify-end">
                                {renderActionButton(projectContact)}
                            </div>
                            <button
                                onClick={() => onEdit(`${contact.id}-${contactType}`)}
                                className="p-1.5 rounded-full hover:bg-blue-500/20 text-gray-400 hover:text-blue-400"
                                aria-label={`Edit ${contact.name}`}
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => onRemove(contact.id, contactType)}
                                className="p-1.5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                aria-label={`Remove ${contact.name}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ContactList; 