import React, { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './DependencyGraph.css';

// We need a separate component to call the useReactFlow hook
const FlowWithLayout = ({ nodes, edges, onNodesChange, onEdgesChange, edgeTypes }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      // Adjust the view to fit all nodes whenever they change
      fitView({ duration: 400, padding: 0.1 });
    }
  }, [nodes, edges, fitView]);

  return (
    <ReactFlow
      className="dependency-graph"
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      edgeTypes={edgeTypes}
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};

const DependencyGraph = (props) => {
  return (
    <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <ReactFlowProvider>
        <FlowWithLayout {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default DependencyGraph; 