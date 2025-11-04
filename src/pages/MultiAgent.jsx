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
} from "@xyflow/react";

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [buttonNodes, setButtonNodes] = useState([]);
  const ref = useRef(null);
  const [allAgents, setAllAgents] = useState([]);
  const [visibleNodes, setVisibleNodes] = useState([0, 4, 9]);
  const [isExpanded, setIsExpanded] = useState(false);

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
            id: "root",
            position: { x: 700, y: 0 },
            style: { width: 160 },
            className: "root-node",
            data: { label: agentName, expanded: false },
          },
        ]);
      } catch (err) {
        console.error("Error loading JSON:", err);
      }
    };
    fetchAgentData();
  }, [setNodes]);

  useEffect(() => {
    if (isExpanded && allAgents.length > 0) {
      updateNodesAndButtons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodes, isExpanded, allAgents]);

  const handleParentClick = () => {
    if (!allAgents.length) return;

    if (!isExpanded) {
      setIsExpanded(true);
      updateNodesAndButtons();
    } else {
      setIsExpanded(false);
      setVisibleNodes([0, 4, 9]);
      setNodes([
        {
          id: "root",
          position: { x: 700, y: 0 },
          style: { width: 160 },
          className: "root-node",
          data: {
            label: allAgents[0]?.agent_name || "Router Agent Multi",
            expanded: false,
          },
        },
      ]);
      setEdges([]);
      setButtonNodes([]);
    }
  };

  const updateNodesAndButtons = () => {
    const rootNode = nodes.find((n) => n.id === "root");
    if (!rootNode || allAgents.length === 0) return;

    const spacingX = 250;
    const spacingY = 160;

    const sortedVisible = [...visibleNodes].sort((a, b) => a - b);
    const totalDisplay = sortedVisible.length;
    const startX = rootNode.position.x - ((totalDisplay - 1) * spacingX) / 2;

    // Always recalculate positions for proper alignment
    const newNodes = sortedVisible.map((agentIndex, i) => {
      const agent = allAgents[agentIndex];

      return {
        id: `agent-${agentIndex + 1}`,
        position: {
          x: startX + i * spacingX,
          y: rootNode.position.y + spacingY,
        },
        className: "agent-node",
        style: { width: 150 },
        data: { agent, index: agentIndex },
      };
    });

    const newEdges = newNodes.map((n) => ({
      id: `edge-root-${n.id}`,
      source: "root",
      target: n.id,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));

    setNodes((prev) => [prev.find((n) => n.id === "root"), ...newNodes]);
    setEdges(newEdges);

    setTimeout(() => {
      createButtons(newNodes, sortedVisible);
    }, 10);
  };

  const createButtons = (agentNodes, sortedVisible) => {
    const expandButtons = [];

    // Always create buttons around node 5 (index 4)
    // Button 1: Between node 1 (index 0) and node 5 (index 4) - controls 2,3,4
    // Button 2: Between node 5 (index 4) and node 10 (index 9) - controls 6,7,8,9

    // Find node 1, 5, and 10
    const node1 = agentNodes.find((n) => n.id === `agent-1`);
    const node5 = agentNodes.find((n) => n.id === `agent-5`);
    const node10 = agentNodes.find((n) => n.id === `agent-10`);

    if (!node1 || !node5 || !node10) return;

    // Button before node 5 (controls nodes 2,3,4)
    const leftIndices = [1, 2, 3]; // indices for agents 2,3,4
    const leftHidden = leftIndices.filter(
      (idx) => !sortedVisible.includes(idx)
    );
    const leftVisible = leftIndices.filter((idx) =>
      sortedVisible.includes(idx)
    );
    const leftExpanded = leftHidden.length === 0;

    expandButtons.push({
      id: `btn-toggle-before-5`,
      type: "expandButton",
      position: {
        x: (node1.position.x + node5.position.x) / 2 - 25,
        y: node1.position.y,
      },
      draggable: false,
      selectable: false,
      style: { width: 50, height: 40 },
      data: {
        label: "...",
        onClick: () =>
          leftExpanded
            ? handleHideAll(leftVisible)
            : handleShowHidden(leftHidden),
      },
    });

    // Button after node 5 (controls nodes 6,7,8,9)
    const rightIndices = [5, 6, 7, 8]; // indices for agents 6,7,8,9
    const rightHidden = rightIndices.filter(
      (idx) => !sortedVisible.includes(idx)
    );
    const rightVisible = rightIndices.filter((idx) =>
      sortedVisible.includes(idx)
    );
    const rightExpanded = rightHidden.length === 0;

    expandButtons.push({
      id: `btn-toggle-after-5`,
      type: "expandButton",
      position: {
        x: (node5.position.x + node10.position.x) / 2 - 25,
        y: node5.position.y,
      },
      draggable: false,
      selectable: false,
      style: { width: 50, height: 40 },
      data: {
        label: "...",
        onClick: () =>
          rightExpanded
            ? handleHideAll(rightVisible)
            : handleShowHidden(rightHidden),
      },
    });

    setButtonNodes(expandButtons);
  };

  const handleShowHidden = (hiddenIndices) => {
    setVisibleNodes((prev) => {
      const newVisible = [...prev, ...hiddenIndices];
      return [...new Set(newVisible)].sort((a, b) => a - b);
    });
  };

  const handleHideAll = (nodesToHide) => {
    setVisibleNodes((prev) => prev.filter((idx) => !nodesToHide.includes(idx)));
  };

  const renderAgentNode = (agent, index) => (
    <div className="agent-content tiny">
      <h4 className="title blue">Associated Agent</h4>
      <div>
        <b>Name:</b> {agent.agent_name || `Agent ${index + 1}`}
      </div>
    </div>
  );

  const ExpandButton = ({ data }) => {
    return (
      <div
        className="button-node expand-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (data.onClick) {
            data.onClick();
          }
        }}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        {data.label}
      </div>
    );
  };

  const nodeTypes = { expandButton: ExpandButton };

  const updatedNodes = [
    ...nodes.map((n) => {
      if (n.id === "root") {
        return {
          ...n,
          data: {
            ...n.data,
            label: (
              <div onClick={handleParentClick}>
                <h4 className="title blue">{n.data.label}</h4>
                <small>(Click to expand/collapse)</small>
              </div>
            ),
          },
        };
      }
      if (n.data?.agent) {
        return {
          ...n,
          data: {
            ...n.data,
            label: renderAgentNode(n.data.agent, n.data.index),
          },
        };
      }
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
