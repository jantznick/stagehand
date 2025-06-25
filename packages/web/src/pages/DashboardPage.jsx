import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building, Briefcase, Users, Folder, Play } from 'lucide-react';
import useHierarchyStore from '../stores/useHierarchyStore';
import ApplicationDetails from '../components/applications/ApplicationDetails';
import TeamDetails from '../components/teams/TeamDetails';

const icons = {
    organization: <Building size={28} className="text-[var(--orange-wheel)]" />,
    company: <Briefcase size={28} className="text-[var(--orange-wheel)]" />,
    team: <Users size={28} className="text-[var(--orange-wheel)]" />,
    project: <Folder size={28} className="text-[var(--orange-wheel)]" />,
};

function DashboardPage() {
    const { teamId, projectId } = useParams();
    const { 
        selectedItem, 
        isLoading, 
        error, 
        fetchAndSetSelectedItem 
    } = useHierarchyStore();

    useEffect(() => {
        const id = projectId || teamId;
        const type = projectId ? 'project' : 'team';

        if (id) {
            fetchAndSetSelectedItem(type, id);
        }
    }, [teamId, projectId, fetchAndSetSelectedItem]);


    return (
        <div className="p-8 max-w-4xl min-w-3/4 mx-auto text-white">
             <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

			{isLoading ? (
                <div className="text-center p-12 text-white/60">Loading...</div>
            ) : error ? (
                <div className="text-center p-12 bg-red-900/50 border border-red-500/50 rounded-xl">
                    <h2 className="text-2xl font-bold text-red-300">Error</h2>
                    <p className="text-red-400">{error}</p>
                </div>
            ) : !selectedItem ? (
                <div className="text-center p-12 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center">
                    <div className="w-16 h-16 bg-[var(--orange-wheel)]/10 rounded-full flex items-center justify-center mb-4">
                        <Play size={32} className="text-[var(--orange-wheel)]"/>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Welcome to Stagehand</h2>
                    <p className="text-[var(--vanilla)]/60">Select an item from the sidebar to get started.</p>
                </div>
			) : (
                <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                    <div className="flex items-center mb-6">
                        <div className="mr-5 flex-shrink-0 bg-[var(--orange-wheel)]/10 p-3 rounded-lg">
                            {icons[selectedItem.type]}
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm text-[var(--vanilla)]/60 font-semibold uppercase tracking-wider">{selectedItem.type}</p>
                            <h2 className="text-3xl font-bold text-white capitalize truncate">{selectedItem.name}</h2>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        {selectedItem.type === 'project' && <ApplicationDetails project={selectedItem} />}
                        {selectedItem.type === 'team' && <TeamDetails team={selectedItem} />}
                        {selectedItem.type !== 'project' && selectedItem.type !== 'team' && (
                            <>
                                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                                <p className="text-[var(--vanilla)]/80">{selectedItem.description || 'No description available for this item.'}</p>
                            </>
                        )}
                    </div>
                </div>
			)}
        </div>
    );
}

export default DashboardPage; 