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
import ContextMenu from "../ContextMenu";

function SingleAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [agentDetails, setAgentDetails] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentName = "YouFibre Sales Agent";
        const response = await fetch(
          `http://68.233.117.127:2090/api/agent-payload/latest/${agentName}`,
          {
            headers: {
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ0ZW5hbnRfaWQiOjEsImV4cCI6MTc2MTg2NTU2Nn0.-REv3f3sHMTXuJNl-bS3lmNk1l7JW3-LACcnmu127dk",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Live API Response:", data);

        const agent =
          data?.configuration?.agent_data?.agent ||
          data?.configuration?.agent_data?.router_agent ||
          {};

        setAgentDetails(agent);

        // --- Parent Node ---
        const parentNode = {
          id: "1",
          position: { x: 300, y: 0 },
          style: {
            width: 220,
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
            backgroundColor: "#e8f0fe",
            border: "1px solid #ccc",
            borderRadius: "8px",
          },
          data: {
            label:
              data?.configuration?.agent_name ||
              agent.agentName ||
              "Unnamed Agent",
          },
        };

        // --- Child Node ---
        const childNode = {
          id: "2",
          position: { x: 280, y: 200 },
          style: {
            width: 320,
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            backgroundColor: "#fff",
            textAlign: "left",
          },
          data: {
            label: (
              <div style={{ fontSize: "13px" }}>
                <div>
                  <strong>Description:</strong>{" "}
                  {agent.agentDescription || "N/A"}
                </div>
                <div>
                  <strong>Model:</strong> {agent.model_name || "N/A"}
                </div>
                <button
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails((prev) => !prev);
                  }}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>
            ),
          },
        };

        const edge = {
          id: "e1-2",
          source: "1",
          target: "2",
        };

        setNodes([parentNode, childNode]);
        setEdges([edge]);
      } catch (error) {
        console.error("❌ Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, []);

  // 👇 Dynamically inject extra details when showDetails toggles
  useEffect(() => {
    if (!agentDetails) return;

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== "2") return n;

        return {
          ...n,
          data: {
            ...n.data,
            label: (
              <div style={{ fontSize: "13px" }}>
                <div>
                  <strong>Description:</strong>{" "}
                  {agentDetails.agentDescription || "N/A"}
                </div>
                <div>
                  <strong>Model:</strong> {agentDetails.model_name || "N/A"}
                </div>

                <button
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails((prev) => !prev);
                  }}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>

                {showDetails && (
                  <div
                    style={{
                      marginTop: "10px",
                      backgroundColor: "#f9fafb",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#374151",
                    }}
                  >
                    {Object.entries(agentDetails)
                      .filter(([key]) => key !== "agentPrompt") // 🚫 remove prompt
                      .map(([key, value]) => (
                        <div key={key} style={{ marginBottom: "4px" }}>
                          <strong>{key}:</strong>{" "}
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : value?.toString() || "N/A"}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ),
          },
        };
      })
    );
  }, [showDetails, agentDetails]);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    const pane = ref.current.getBoundingClientRect();
    setMenu({
      id: node.id,
      top: event.clientY < pane.height - 200 && event.clientY,
      left: event.clientX < pane.width - 200 && event.clientX,
      right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
      bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
    });
  }, []);

  const onPaneClick = useCallback(() => setMenu(null), []);

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
        {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
      </ReactFlow>
    </div>
  );
}

export default SingleAgent;
