import React from 'react';
import { Star, GitFork, AlertCircle, History, Eye, Scale } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon, label, value, tooltip, href }) => {
    const Icon = icon;
    
    const content = (
         <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg h-full" title={tooltip}>
            <Icon className="text-gray-400" size={20} />
            <div>
                <div className="text-sm text-gray-400">{label}</div>
                <div className="text-md font-semibold text-white">{value}</div>
            </div>
        </div>
    );

    if (!href) {
        return content;
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:bg-white/10 rounded-lg transition-colors">
            {content}
        </a>
    );
};

const RepoStats = ({ stats, repositoryUrl }) => {
    if (!stats) return null;
    
    return (
        <div className="pt-6">
            <h4 className="text-lg font-medium text-white pb-2 border-b border-white/10">Repository Stats</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <StatCard
                    href={`${repositoryUrl}/stargazers`}
                    icon={Star}
                    label="Stars"
                    value={stats.stars.toLocaleString()}
                    tooltip="View stargazers on GitHub"
                />
                <StatCard
                    href={`${repositoryUrl}/network/members`}
                    icon={GitFork}
                    label="Forks"
                    value={stats.forks.toLocaleString()}
                    tooltip="View forks on GitHub"
                />
                <StatCard
                    href={`${repositoryUrl}/issues`}
                    icon={AlertCircle}
                    label="Open Issues"
                    value={stats.openIssues.toLocaleString()}
                    tooltip="View issues on GitHub"
                />
                <StatCard
                    icon={Eye}
                    label="Visibility"
                    value={stats.visibility.charAt(0).toUpperCase() + stats.visibility.slice(1)}
                    tooltip="Repository visibility (public/private)"
                />
                <StatCard
                    icon={Scale}
                    label="License"
                    value={stats.license || 'Not specified'}
                    tooltip="Repository license"
                />
                <StatCard
                    href={`${repositoryUrl}/commits`}
                    icon={History}
                    label="Last Push"
                    value={formatDistanceToNow(new Date(stats.pushedAt), { addSuffix: true })}
                    tooltip={`View recent commits on GitHub. Last push: ${new Date(stats.pushedAt).toLocaleString()}`}
                />
            </div>
        </div>
    );
};

export default RepoStats; 