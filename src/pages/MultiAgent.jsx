import "../App.css";
import "reactflow/dist/style.css";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { initialNodes, initialEdges } from "../initialElements";
import ContextMenu from "../ContextMenu";

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menu, setMenu] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [agentData, setAgentData] = useState(null);
  const ref = useRef(null);

  // toggle expand state for a node
  const toggleDetails = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentName = "Router Agent Multi";
        const response = await fetch(
          `http://68.233.117.127:2090/api/agent-payload/latest/${agentName}`,
          {
            headers: {
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ0ZW5hbnRfaWQiOjEsImV4cCI6MTc2MTc3NTQ2N30.wzr9qcbbTicFF8UTFFFkM_DHjNDy18RdLLDr8xCswUM",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("API Response:", JSON.stringify(data, null, 2));
        setAgentData(data);

        const rootNode = {
          id: "1",
          position: { x: 175, y: 0 },
          data: { label: data.agent_name || agentName },
        };

        const associatedAgents =
          data?.configuration?.agent_data?.router_agent?.associated_agents ||
          [];

        const childNodes = associatedAgents.map((agent, index) => ({
          id: String(index + 2),
          position: {
            x: index * 175 - (associatedAgents.length - 1) * 87.5,
            y: 250,
          },
          style: {
            width: 220,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fdfdfd",
          },
          data: {
            label: (
              <div style={{ fontSize: "12px", textAlign: "left" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    color: "#333",
                  }}
                >
                  {agent.agent_name || "N/A"}
                </div>
                <div style={{ color: "#666" }}>
                  <div>Description: {agent.description || "N/A"}</div>
                  <div>Model: {agent.model_name || "N/A"}</div>
                </div>

                {/* Action Button */}
                <button
                  style={{
                    marginTop: "8px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleDetails(String(index + 2))}
                >
                  {expandedNodes[String(index + 2)]
                    ? "Hide Details"
                    : "Show Details"}
                </button>

                {/* Extra info toggle */}
                {expandedNodes[String(index + 2)] && (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "#444",
                      background: "#f7f7f7",
                      padding: "5px",
                      borderRadius: "4px",
                    }}
                  >
                    <div>Agent ID: {agent.id || "Unknown"}</div>
                    <div>Role: {agent.role || "Not specified"}</div>
                    <div>Tools: {agent.tools?.join(", ") || "None"}</div>
                  </div>
                )}
              </div>
            ),
          },
        }));

        const newEdges = childNodes.map((node) => ({
          id: `e1-${node.id}`,
          source: "1",
          target: node.id,
        }));

        setNodes([rootNode, ...childNodes]);
        setEdges(newEdges);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, [setNodes, setEdges, expandedNodes]);

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
    <div style={{ width: "100%", height: "100vh" }}>
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
        {menu && (
          <ContextMenu onClick={onPaneClick} {...menu}>
            <h1>hii</h1>
          </ContextMenu>
        )}
      </ReactFlow>
    </div>
  );
}

export default MultiAgent;
