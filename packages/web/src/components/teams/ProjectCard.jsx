import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, ArrowRight } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const statusColors = {
    RELEASED: 'bg-green-500',
    IN_DEVELOPMENT: 'bg-blue-500',
    TESTING: 'bg-yellow-500',
    MAINTENANCE: 'bg-purple-500',
    DISCONTINUED: 'bg-gray-500',
    PLANNING: 'bg-indigo-500',
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
      <div>
        <div className="flex items-center mb-3">
          <Folder size={20} className="text-[var(--xanthous)] mr-3" />
          <h4 className="text-lg font-bold text-white truncate">{project.name}</h4>
        </div>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {project.description || 'No description available.'}
        </p>
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>Version: {project.version || 'N/A'}</span>
            <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${statusColors[project.deploymentStatus] || 'bg-gray-400'}`}></span>
                {project.deploymentStatus?.toLowerCase().replace('_', ' ') || 'Unknown'}
            </span>
        </div>
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-[var(--orange-wheel)]/10 text-[var(--orange-wheel)] hover:bg-[var(--orange-wheel)]/20"
        >
          View Details <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProjectCard; 