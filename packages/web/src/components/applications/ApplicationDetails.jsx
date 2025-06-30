import React, { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import useProjectStore from '../../stores/useProjectStore';
import useFindingStore from '../../stores/useFindingStore';
import useIntegrationStore from '../../stores/useIntegrationStore';
import ContactManager from '../contacts/ContactManager';
import TechnologyManager from '../technologies/TechnologyManager';
import ProjectGraphContainer from '../architecture/ProjectGraphContainer';
import LinkRepositoryControl from './LinkRepositoryControl';
import LinkSecurityToolControl from './LinkSecurityToolControl';
import RepoStats from './RepoStats';
import FindingList from '../findings/FindingList';
import FindingsSeverityChart from '../findings/FindingsSeverityChart';

const TABS = ['Details', 'Security', 'Architecture', 'Contacts', 'Technologies'];

const ApplicationDetails = ({ project }) => {
	const [activeTab, setActiveTab] = useState(TABS[0]);
	const [isEditing, setIsEditing] = useState(false);
	const [editableProject, setEditableProject] = useState(project);
	const [isEditingName, setIsEditingName] = useState(false);
	const [editingName, setEditingName] = useState(project.name);
	const [isEditingType, setIsEditingType] = useState(false);
	const [editingType, setEditingType] = useState(project.projectType || '');
	const [syncError, setSyncError] = useState(null);

	const { updateProject: updateHierarchyProject, isLoading: isHierarchyLoading, fetchAndSetSelectedItem } = useHierarchyStore();
	const { fetchRepoStats, repoStats, isStatsLoading, statsError } = useProjectStore();
	const { syncFindings, isLoading: isFindingSyncing } = useFindingStore();
	const { syncSecurityToolIntegration, isLoading: isSecuritySyncing } = useIntegrationStore();

	useEffect(() => {
		setEditableProject(project);
		if (project?.scmIntegrationId && project?.repositoryUrl) {
			fetchRepoStats(project.id);
		}
	}, [project, fetchRepoStats]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setEditableProject(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value
		}));
	};

	const handleSave = async () => {
		try {
			await updateHierarchyProject(project.id, editableProject);
			await fetchAndSetSelectedItem('project', project.id); // Refresh data
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update project", error);
			// Optionally: show an error message to the user
		}
	};

	const handleNameSave = async () => {
		if (editingName === project.name) {
			setIsEditingName(false);
			return;
		}
		try {
			await updateHierarchyProject(project.id, { name: editingName });
			await fetchAndSetSelectedItem('project', project.id); // Refresh data
			setIsEditingName(false);
		} catch (error) {
			console.error("Failed to update project name", error);
		}
	};

	const handleTypeSave = async () => {
		if (editingType === project.projectType) {
			setIsEditingType(false);
			return;
		}
		try {
			await updateHierarchyProject(project.id, { projectType: editingType });
			await fetchAndSetSelectedItem('project', project.id); // Refresh data
			setIsEditingType(false);
		} catch (error) {
			console.error("Failed to update project type", error);
		}
	};

	const handleSync = async () => {
		let synced = false;
		if (project.scmIntegrationId) {
			console.log('Syncing SCM findings...');
			await syncFindings(project.scmIntegrationId, [project.id]);
			synced = true;
		}
		if (project.securityToolIntegrationId) {
			console.log('Syncing security tool findings...');
			await syncSecurityToolIntegration(project.securityToolIntegrationId);
			synced = true;
		}
		if (!synced) {
			setSyncError('No SCM or Security Tool integration is linked to this project for finding analysis.');
			setTimeout(() => setSyncError(null), 5000); // Clear error after 5 seconds
		}
	};

	const handleCancel = () => {
		setEditableProject(project);
		setIsEditing(false);
	};

	const formatEnum = (value) => {
		if (!value) return 'Not set';
		return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	const projectTypeOptions = [
		"SERVICE", "LIBRARY", "FRONTEND_APP", "BACKEND_APP", "MOBILE_APP",
		"CLI_TOOL", "OWNED_HARDWARE", "CLOUD_HARDWARE", "EXTERNAL_BOUGHT_SOFTWARE", "OTHER"
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between pb-4 border-b border-white/10">
				<div className="flex items-center gap-4 flex-grow">
					<div className="flex-shrink-0 bg-[var(--orange-wheel)]/10 p-3 rounded-lg">
						<Folder size={28} className="text-[var(--orange-wheel)]" />
					</div>
					<div className="flex-grow">
						{isEditingName ? (
							<div className="flex items-center gap-2">
								<input
									type="text"
									value={editingName}
									onChange={(e) => setEditingName(e.target.value)}
									className="flex-grow bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xl text-white p-2 font-semibold"
									autoFocus
									onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
								/>
								<button onClick={handleNameSave} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-500" disabled={isHierarchyLoading}>Save</button>
								<button onClick={() => setIsEditingName(false)} className="px-3 py-1 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<h2 onClick={() => { setEditingName(project.name); setIsEditingName(true); }} className="text-3xl font-bold text-white cursor-pointer">{project.name}</h2>
								{isEditingType ? (
									<div className="flex items-center gap-2">
										<select
											value={editingType}
											onChange={(e) => setEditingType(e.target.value)}
											className="bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
										>
											<option value="">Select type...</option>
											{projectTypeOptions.map(opt => <option key={opt} value={opt}>{formatEnum(opt)}</option>)}
										</select>
										<button onClick={handleTypeSave} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-500" disabled={isHierarchyLoading}>Save</button>
										<button onClick={() => setIsEditingType(false)} className="px-3 py-1 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
									</div>
								) : (
									project.projectType ? (
										<span onClick={() => { setEditingType(project.projectType); setIsEditingType(true); }} className="text-lg font-normal text-gray-400 cursor-pointer">- {formatEnum(project.projectType)}</span>
									) : (
										<button onClick={() => { setEditingType(project.projectType || ''); setIsEditingType(true); }} className="text-lg font-normal text-blue-400 hover:text-blue-300">
											+ Add type
										</button>
									)
								)}
							</div>
						)}
						<p className="text-sm text-gray-400 mt-1">Manage application metadata, security findings, and more.</p>
					</div>
				</div>

				<div>
					{activeTab === 'Details' && !isEditingName && !isEditingType && (
						isEditing ? (
							<div className="flex items-center gap-x-2">
								<button onClick={handleCancel} className="px-3 py-1 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
								<button onClick={handleSave} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-500" disabled={isHierarchyLoading}>
									{isHierarchyLoading ? 'Saving...' : 'Save'}
								</button>
							</div>
						) : (
							<button onClick={() => setIsEditing(true)} className="px-3 py-1 text-sm rounded-md bg-gray-700 hover:bg-gray-600">Edit</button>
						)
					)}
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="border-b border-gray-700">
				<nav className="-mb-px flex space-x-8" aria-label="Tabs">
					{TABS.map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`${activeTab === tab
									? 'border-blue-500 text-blue-400'
									: 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
								} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
						>
							{tab}
						</button>
					))}
				</nav>
			</div>

			{/* Tab Content */}
			<div className="pt-4">
				{activeTab === 'Details' && (
					<div className="space-y-8">
						{/* Core Details Section */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-400">Application URL</label>
								{isEditing ? (
									<input type="text" name="applicationUrl" value={editableProject.applicationUrl || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
								) : (
									<p className="mt-1 text-white">{project.applicationUrl || 'Not set'}</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400">Version</label>
								{isEditing ? (
									<input type="text" name="version" value={editableProject.version || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
								) : (
									<p className="mt-1 text-white">{project.version || 'Not set'}</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400">Deployment Status</label>
								{isEditing ? (
									<select name="deploymentStatus" value={editableProject.deploymentStatus || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
										<option value="PLANNING">Planning</option>
										<option value="IN_DEVELOPMENT">In Development</option>
										<option value="TESTING">Testing</option>
										<option value="RELEASED">Released</option>
										<option value="MAINTENANCE">Maintenance</option>
										<option value="DISCONTINUED">Discontinued</option>
									</select>
								) : (
									<p className="mt-1 text-white capitalize">{project.deploymentStatus?.toLowerCase().replace('_', ' ') || 'Not set'}</p>
								)}
							</div>
							<LinkRepositoryControl project={project} isEditing={isEditing} />
							<LinkSecurityToolControl project={project} isEditing={isEditing} />
						</div>

						{/* Repository Stats Section */}
						{isStatsLoading && <div className="text-gray-400">Loading repository stats...</div>}
						{statsError && <div className="text-red-400">Error: {statsError}</div>}
						{repoStats && !isEditing && <RepoStats stats={repoStats} repositoryUrl={project.repositoryUrl} />}

						{/* Operational Readiness Section */}
						<div className="pt-6">
							<h4 className="text-lg font-medium text-white pb-2 border-b border-white/10">Operational Readiness</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
								<div>
									<label className="block text-sm font-medium text-gray-400">Communication Channel</label>
									{isEditing ? (
										<input type="text" name="communicationChannel" value={editableProject.communicationChannel || ''} onChange={handleInputChange} placeholder="e.g., #engineering-app-alerts" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.communicationChannel || 'Not set'}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Documentation URL</label>
									{isEditing ? (
										<input type="text" name="documentationUrl" value={editableProject.documentationUrl || ''} onChange={handleInputChange} placeholder="e.g., Confluence, Notion" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.documentationUrl || 'Not set'}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">API Reference URL</label>
									{isEditing ? (
										<input type="text" name="apiReferenceUrl" value={editableProject.apiReferenceUrl || ''} onChange={handleInputChange} placeholder="e.g., Swagger, OpenAPI" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.apiReferenceUrl || 'Not set'}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Runbook URL</label>
									{isEditing ? (
										<input type="text" name="runbookUrl" value={editableProject.runbookUrl || ''} onChange={handleInputChange} placeholder="Link to on-call runbooks" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.runbookUrl || 'Not set'}</p>
									)}
								</div>
							</div>
						</div>

						{/* Security & Compliance Section */}
						<div className="pt-6">
							<h4 className="text-lg font-medium text-white pb-2 border-b border-white/10">Security & Compliance</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mt-4">
								<div>
									<label className="block text-sm font-medium text-gray-400">Data Classification</label>
									{isEditing ? (
										<select name="dataClassification" value={editableProject.dataClassification || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
											<option value="">Select classification...</option>
											<option value="PUBLIC">Public</option>
											<option value="INTERNAL">Internal</option>
											<option value="SENSITIVE">Sensitive</option>
											<option value="RESTRICTED">Restricted</option>
										</select>
									) : (
										<p className="mt-1 text-white">{formatEnum(project.dataClassification)}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Application Criticality</label>
									{isEditing ? (
										<select name="applicationCriticality" value={editableProject.applicationCriticality || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
											<option value="">Select criticality...</option>
											<option value="LOW">Low</option>
											<option value="MEDIUM">Medium</option>
											<option value="HIGH">High</option>
											<option value="CRITICAL">Critical</option>
										</select>
									) : (
										<p className="mt-1 text-white">{formatEnum(project.applicationCriticality)}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Last Security Review</label>
									{isEditing ? (
										<input type="date" name="lastSecurityReview" value={editableProject.lastSecurityReview ? new Date(editableProject.lastSecurityReview).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.lastSecurityReview ? new Date(project.lastSecurityReview).toLocaleDateString() : 'Not set'}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Threat Model</label>
									{isEditing ? (
										<input type="text" name="threatModelUrl" value={editableProject.threatModelUrl || ''} onChange={handleInputChange} placeholder="Link to threat model" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
									) : (
										<p className="mt-1 text-white">{project.threatModelUrl || 'Not set'}</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400">Externally Exposed</label>
									{isEditing ? (
										<div className="flex items-center h-full">
											<input id="isExternallyExposed" name="isExternallyExposed" type="checkbox" checked={editableProject.isExternallyExposed || false} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500" />
										</div>
									) : (
										<p className="mt-1 text-white">{project.isExternallyExposed ? 'Yes' : 'No'}</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'Security' && (
					<div className="space-y-6">
						<div className="flex justify-between items-center">
							<div>
								<h4 className="text-lg font-medium text-white">Security Posture</h4>
								<p className="text-sm text-gray-400">Overview of findings from integrated security tools.</p>
							</div>
							<div className="flex items-center gap-4">
								<button
									onClick={handleSync}
									disabled={isFindingSyncing || isSecuritySyncing}
									className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
								>
									{isFindingSyncing || isSecuritySyncing ? 'Syncing...' : 'Sync Findings'}
								</button>
							</div>
						</div>
						{syncError && (
							<div className="p-3 my-2 text-sm text-red-200 bg-red-800/50 rounded-md text-center">
								{syncError}
							</div>
						)}
						<FindingsSeverityChart project={project} />
						<FindingList project={project} />
					</div>
				)}

				{activeTab === 'Architecture' && (
					<div className="pt-2">
						<ProjectGraphContainer
							projectId={project.id}
							companyId={project.team?.companyId}
						/>
					</div>
				)}

				{activeTab === 'Contacts' && (
					<ContactManager project={project} />
				)}

				{activeTab === 'Technologies' && (
					<TechnologyManager project={project} />
				)}
			</div>
		</div>
	);
};

export default ApplicationDetails;