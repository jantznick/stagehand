import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Navigate } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from 'lucide-react';

const FeatureBadge = ({ status }) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    const statusClasses = {
        ACTIVE: "bg-green-100 text-green-800",
        PROMO: "bg-yellow-100 text-yellow-800",
        DISABLED: "bg-gray-100 text-gray-800",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

// A new component to manage the state of the feature editor for a single organization
const FeatureEditor = ({ org, allFeatures, onSave }) => {
    const initialFeatures = allFeatures.reduce((acc, feature) => {
        const orgFeature = org.features.find(f => f.feature.key === feature.key);
        acc[feature.id] = orgFeature ? orgFeature.status : 'DISABLED';
        return acc;
    }, {});

    const [featureStatuses, setFeatureStatuses] = useState(initialFeatures);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Check if the current statuses are different from the initial ones
        const hasChanged = JSON.stringify(featureStatuses) !== JSON.stringify(initialFeatures);
        setIsDirty(hasChanged);
    }, [featureStatuses, initialFeatures]);

    const handleStatusChange = (featureId, newStatus) => {
        setFeatureStatuses(prev => ({ ...prev, [featureId]: newStatus }));
    };

    const handleCancel = () => {
        setFeatureStatuses(initialFeatures);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const featuresToUpdate = Object.entries(featureStatuses).map(([featureId, status]) => ({
            featureId,
            status,
        }));

        try {
            await onSave(org.id, featuresToUpdate);
            // Parent component will refetch, so we just need to reset the state here
            setFeatureStatuses(featureStatuses); // This might seem redundant but re-initializes `isDirty`
        } catch (error) {
            console.error("Failed to save features", error);
            // Optionally, show an error message to the user
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Manage Features</h4>
            {allFeatures.map(feature => (
                <div key={feature.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-200">{feature.key}</p>
                        {feature.description && <p className="text-xs text-gray-400 mt-1">{feature.description}</p>}
                    </div>
                    <select
                        value={featureStatuses[feature.id]}
                        onChange={(e) => handleStatusChange(feature.id, e.target.value)}
                        className="block w-40 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                        <option>ACTIVE</option>
                        <option>PROMO</option>
                        <option>DISABLED</option>
                    </select>
                </div>
            ))}
            <div className="flex justify-end pt-4 space-x-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex justify-center rounded-lg border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!isDirty || isSaving}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};


const SuperAdminPage = () => {
    const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
    const [organizations, setOrganizations] = useState([]);
    const [allFeatures, setAllFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [orgsResponse, featuresResponse] = await Promise.all([
                fetch('/api/v1/admin/organizations'),
                fetch('/api/v1/admin/features')
            ]);

            if (!orgsResponse.ok) throw new Error('Failed to fetch organizations');
            if (!featuresResponse.ok) throw new Error('Failed to fetch features');

            const orgsData = await orgsResponse.json();
            const featuresData = await featuresResponse.json();

            setOrganizations(orgsData);
            setAllFeatures(featuresData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchData();
        }
    }, [isSuperAdmin, fetchData]);

    const handleSaveFeatures = async (orgId, features) => {
        const response = await fetch(`/api/v1/admin/organizations/${orgId}/features`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save features');
        }
        // Refetch all data to ensure UI is consistent
        await fetchData();
    };


    if (!isSuperAdmin) {
        return <Navigate to="/" />;
    }

    if (loading) {
        return <div className="p-8 text-white">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="p-8 text-white max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
            <div className="w-full space-y-2">
                {organizations.map((org) => {
                    const orgFeaturesMap = new Map(org.features.map(f => [f.feature.key, f.status]));
                    return (
                        <Disclosure key={org.id} as="div" className="bg-white/5 border border-white/10 rounded-xl">
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="flex w-full justify-between items-center rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-white/10 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold">{org.name}</span>
                                            <span className="text-gray-400 text-xs font-mono">{org.hostname}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400 text-sm">{org.plan?.name || 'N/A'} Plan</span>
                                            <ChevronUpIcon
                                                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-400 transition-transform`}
                                            />
                                        </div>
                                    </Disclosure.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition-all ease-out duration-300"
                                        enterFrom="opacity-0 -translate-y-4"
                                        enterTo="opacity-100 translate-y-0"
                                        leave="transition-all ease-in duration-200"
                                        leaveFrom="opacity-100 translate-y-0"
                                        leaveTo="opacity-0 -translate-y-4"
                                    >
                                        <Disclosure.Panel className="px-4 pt-4 pb-4 text-sm text-gray-500 border-t border-white/10">
                                            <FeatureEditor org={org} allFeatures={allFeatures} onSave={handleSaveFeatures} />
                                        </Disclosure.Panel>
                                    </Transition>
                                </>
                            )}
                        </Disclosure>
                    )
                })}
            </div>
        </div>
    );
};

export default SuperAdminPage;
