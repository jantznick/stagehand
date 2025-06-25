import React from 'react';
import ProjectCard from './ProjectCard';
import useHierarchyStore from '../../stores/useHierarchyStore';

const TeamDetails = ({ team }) => {
  const { getDisplayName } = useHierarchyStore();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Team Description</h3>
        <p className="text-gray-300">{team.description || 'No description provided.'}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">
          {getDisplayName('project', 'plural')} ({team.projects?.length || 0})
        </h3>
        {team.projects && team.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-400">This team doesn't have any {getDisplayName('project', 'plural').toLowerCase()} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetails; 