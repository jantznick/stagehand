import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import useArchitectureStore from '../../stores/useArchitectureStore';
import DependencyGraph from './DependencyGraph';
import AddRelationshipForm from './AddRelationshipForm';
import ConfirmationModal from '../ConfirmationModal';
import CustomEdge from './CustomEdge';
import { getLayoutedElements } from '../../lib/layout';
import useHierarchyStore from '../../stores/useHierarchyStore';

const ProjectGraphContainer = ({ projectId }) => {
  const { activeCompany } = useHierarchyStore(state => ({ activeCompany: state.activeCompany }));

  const {
    initialNodes,
    initialEdges,
    isLoading,
    error,
    fetchProjectGraph,
    deleteRelationship,
    fetchCompanyGraph,
  } = useArchitectureStore((state) => ({
    initialNodes: state.nodes,
    initialEdges: state.edges,
    isLoading: state.isLoading,
    error: state.error,
    fetchProjectGraph: state.fetchProjectGraph,
    deleteRelationship: state.deleteRelationship,
    fetchCompanyGraph: state.fetchCompanyGraph,
  }));

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectGraph(projectId);
    } else if (activeCompany) {
      fetchCompanyGraph(activeCompany.id);
    }
  }, [projectId, activeCompany, fetchProjectGraph, fetchCompanyGraph]);
  
  const handleDeleteClick = (event, edgeId) => {
    setSelectedEdgeId(edgeId);
    setIsModalOpen(true);
  };
  
  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  useEffect(() => {
    if (initialNodes.length > 0) {
      const layoutedNodes = getLayoutedElements(initialNodes, initialEdges);
      const styledNodes = layoutedNodes.map(node => ({
        ...node,
        className: node.data.isPrimary ? 'primary-node' : '',
      }));
      setNodes(styledNodes);

      const edgesWithDelete = initialEdges.map(edge => ({
        ...edge,
        type: 'custom',
        data: { ...edge.data, onDelete: handleDeleteClick }
      }));
      setEdges(edgesWithDelete);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [initialNodes, initialEdges]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const handleConfirmDelete = async () => {
    if (!selectedEdgeId || !activeCompany?.id) return;
    setIsDeleting(true);
    try {
      await deleteRelationship(activeCompany.id, selectedEdgeId);
      setIsModalOpen(false);
      setSelectedEdgeId(null);
    } catch (e) {
      console.error("Failed to delete relationship:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div>Loading dependencies...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Dependency"
        message={`Are you sure you want to remove this dependency? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">
          Application Dependencies
        </h3>
        <DependencyGraph
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          edgeTypes={edgeTypes}
        />
        
        {projectId && (
          <div style={{ marginTop: '24px' }}>
            <AddRelationshipForm sourceProjectId={projectId} />
          </div> 
        )}
        
      </div>
    </>
  );
};

export default ProjectGraphContainer; 