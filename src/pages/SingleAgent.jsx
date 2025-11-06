import "../App.css";
import "reactflow/dist/style.css";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ContextMenu from "../ContextMenu";

function SingleAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const ref = useRef(null);

  const handleToggleNode = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await fetch("/router_agent_single.json");

        if (!response.ok) {
          throw new Error("Failed to load local JSON");
        }

        const data = await response.json();
        console.log("Loaded Data:", JSON.stringify(data, null, 2));
        setAgentData(data);

        // Extract agent details from the response
        const agent = data?.agent || {};

        // Parent Node - Agent Name
        const parentNode = {
          id: "1",
          position: { x: 700, y: 0 },
          style: { width: 460 },
          className: "root-node",
          data: {
            label: (
              <div className="root-label" onClick={handleToggleNode}>
                <h3 className="title blue">
                  {agent.agentName || "YouFibre Sales Agent"}
                </h3>
              </div>
            ),
          },
        };

        // Child Node - Agent Details
        const childNode = {
          id: "2",
          position: { x: 700, y: 200 },
          style: { width: 460, padding: "15px" },
          className: "agent-node",
          data: {
            label: (
              <div className="agent-content">
                <div className="title blue" style={{ marginBottom: "10px" }}>
                  Agent Details
                </div>
                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Model:</strong> {agent.model_name || "N/A"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>App URL:</strong>{" "}
                    {agent.agentAppUrl ? (
                      <a
                        href={agent.agentAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6" }}
                      >
                        {agent.agentAppUrl}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Document:</strong> {agent.documentName || "N/A"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Description:</strong>{" "}
                    {agent.agentDescription || "N/A"}
                  </div>
                </div>
              </div>
            ),
          },
        };

        const edge = {
          id: "e1-2",
          source: "1",
          target: "2",
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        };

        if (isExpanded) {
          setNodes([parentNode, childNode]);
          setEdges([edge]);
        } else {
          setNodes([parentNode]);
          setEdges([]);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, [setNodes, setEdges, isExpanded, handleToggleNode]);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();

      const pane = ref.current.getBoundingClientRect();
      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 200 && event.clientY,
        left: event.clientX < pane.width - 200 && event.clientX,
        right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
        bottom:
          event.clientY >= pane.height - 200 && pane.height - event.clientY,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  return (
    <div className="flow-wrapper">
      <ReactFlow
        ref={ref}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        fitView
      >
        <Background />
        {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
      </ReactFlow>
    </div>
  );
}

export default SingleAgent;
