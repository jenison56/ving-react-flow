import "../App.css";
import "./MultiAgent.css";
import "reactflow/dist/style.css";
import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [buttonNodes, setButtonNodes] = useState([]); // custom buttons as nodes
  const ref = useRef(null);
  const [allAgents, setAllAgents] = useState([]);

  // ✅ Load JSON and create root node
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const res = await fetch("/router_agent_multi_10_agents.json");
        if (!res.ok) throw new Error("Failed to load local JSON");
        const data = await res.json();

        const agentName = data.agent_name || "Router Agent Multi";
        const associatedAgents =
          data?.configuration?.agent_data?.router_agent?.associated_agents ||
          [];

        setAllAgents(associatedAgents);

        setNodes([
          {
            id: "1",
            position: { x: 700, y: 0 },
            style: { width: 160 },
            className: "root-node",
            data: { label: agentName, expanded: false, associatedAgents },
          },
        ]);
      } catch (err) {
        console.error("Error loading JSON:", err);
      }
    };
    fetchAgentData();
  }, []);

  // ✅ Expand root node → show all odd agents initially
  const handleParentClick = (node) => {
    const { expanded } = node.data;
    if (!allAgents.length) return;

    if (!expanded) {
      const oddAgents = allAgents.filter((_, i) => i % 2 === 0);
      const spacingX = 250,
        spacingY = 160;
      const startX = node.position.x - ((oddAgents.length - 1) * spacingX) / 2;

      const newNodes = oddAgents.map((agent, i) => ({
        id: `agent-${i * 2 + 1}`,
        position: { x: startX + i * spacingX, y: node.position.y + spacingY },
        className: "agent-node",
        style: { width: 150 },
        data: { agent, index: i * 2, expanded: false },
      }));

      const newEdges = newNodes.map((n) => ({
        id: `edge-1-${n.id}`,
        source: "1",
        target: n.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

      setNodes((prev) => [
        ...prev.map((n) =>
          n.id === "1" ? { ...n, data: { ...n.data, expanded: true } } : n
        ),
        ...newNodes,
      ]);
      setEdges((prev) => [...prev, ...newEdges]);

      // ✅ Create button nodes between each odd pair
      const newButtons = [];
      for (let i = 0; i < newNodes.length - 1; i++) {
        const left = newNodes[i];
        const right = newNodes[i + 1];
        const evenIndex = left.data.index + 1;
        if (allAgents[evenIndex]) {
          newButtons.push({
            id: `btn-${evenIndex + 1}`,
            type: "buttonNode",
            position: {
              x: (left.position.x + right.position.x) / 2,
              y: left.position.y + 100,
            },
            data: {
              label: `+ Show Agent ${evenIndex + 1}`,
              evenIndex,
              onClick: () => handleEvenInsert(evenIndex),
            },
          });
        }
      }
      setButtonNodes(newButtons);
    } else {
      // collapse
      setNodes([
        {
          id: "1",
          position: { x: 700, y: 0 },
          style: { width: 160 },
          className: "root-node",
          data: { ...node.data, expanded: false },
        },
      ]);
      setEdges([]);
      setButtonNodes([]);
    }
  };

  // ✅ Show even agent between two nodes when button clicked
  const handleEvenInsert = (evenIndex) => {
    const evenAgent = allAgents[evenIndex];
    if (!evenAgent) return;

    setNodes((prev) => {
      const parent = prev.find((n) => n.id === "1");
      const oddNodes = prev.filter((n) => n.id.startsWith("agent-"));
      if (!oddNodes.length) return prev;

      const leftNode = oddNodes.find((n) => n.data.index === evenIndex - 1);
      const rightNode = oddNodes.find((n) => n.data.index === evenIndex + 1);
      if (!leftNode || !rightNode) return prev;

      const newX = (leftNode.position.x + rightNode.position.x) / 2;
      const newY = leftNode.position.y;

      const newNode = {
        id: `agent-${evenIndex + 1}`,
        position: { x: newX, y: newY },
        className: "agent-node even",
        style: { width: 150 },
        data: { agent: evenAgent, index: evenIndex, expanded: false },
      };

      const newEdge = {
        id: `edge-1-${newNode.id}`,
        source: "1",
        target: newNode.id,
        markerEnd: { type: MarkerType.ArrowClosed },
      };

      setButtonNodes((prevBtns) =>
        prevBtns.filter((b) => b.data.evenIndex !== evenIndex)
      );

      return [...prev, newNode];
    });

    setEdges((prev) => [
      ...prev,
      {
        id: `edge-1-agent-${evenIndex + 1}`,
        source: "1",
        target: `agent-${evenIndex + 1}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ]);
  };

  // ✅ Node renderers
  const renderAgentNode = (agent, index) => (
    <div className="agent-content tiny">
      <h4 className="title blue">Associated Agent</h4>
      <div>
        <b>Name:</b> {agent.agent_name || `Agent ${index + 1}`}
      </div>
    </div>
  );

  // ✅ Custom node type for buttons
  const ButtonNode = ({ data }) => (
    <div className="button-node" onClick={data.onClick}>
      {data.label}
    </div>
  );

  const nodeTypes = { buttonNode: ButtonNode };

  const updatedNodes = [
    ...nodes.map((n) => {
      if (n.id === "1") {
        return {
          ...n,
          data: {
            ...n.data,
            label: (
              <div onClick={() => handleParentClick(n)}>
                <h4 className="title blue">{n.data.label}</h4>
                <small>(Click to expand/collapse)</small>
              </div>
            ),
          },
        };
      }
      if (n.data?.agent)
        return {
          ...n,
          data: {
            ...n.data,
            label: renderAgentNode(n.data.agent, n.data.index),
          },
        };
      return n;
    }),
    ...buttonNodes,
  ];

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  return (
    <div className="flow-wrapper">
      <ReactFlow
        ref={ref}
        nodes={updatedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

export default MultiAgent;
