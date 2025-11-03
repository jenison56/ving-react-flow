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
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ0ZW5hbnRfaWQiOjEsImV4cCI6MTc2MjE4NDcxN30.bC5476gfxOMiRnE4CVYE0fmSC22d5NH4sOz54H5yBpo",
            },
          }
        );

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();

        const agent =
          data?.configuration?.agent_data?.agent ||
          data?.configuration?.agent_data?.router_agent ||
          {};

        setAgentDetails(agent);

        // 🌟 Parent Node styled exactly like Router Agent Multi
        const parentNode = {
          id: "1",
          position: { x: 700, y: 0 },
          style: { width: 460 },
          className: "root-node",
          data: {
            label: (
              <div className="root-label">
                <h3 className="title blue">
                  {data?.configuration?.agent_name ||
                    agent.agentName ||
                    "YouFibre Sales Agent"}
                </h3>
              </div>
            ),
          },
        };

        // 🌟 Child Node (Agent Details)
        const childNode = {
          id: "2",
          position: { x: 700, y: 300 },
          style: { width: 460 },
          className: "agent-node",
          data: {
            label: (
              <div className="agent-content">
                <div className="title blue">Agent Details</div>
                <div>
                  <strong>Description:</strong>{" "}
                  {agent.agentDescription || "N/A"}
                </div>
                <div>
                  <strong>Model:</strong> {agent.model_name || "N/A"}
                </div>

                <div className="button-center">
                  <button
                    className="toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails((prev) => !prev);
                    }}
                  >
                    {showDetails ? "Hide Summary" : "Show Summary"}
                  </button>
                </div>
              </div>
            ),
          },
        };

        const edge = {
          id: "e1-2",
          source: "1",
          target: "2",
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        };

        setNodes([parentNode, childNode]);
        setEdges([edge]);
      } catch (error) {
        console.error("❌ Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, []);

  // 🌟 Dynamically update summary on toggle
  useEffect(() => {
    if (!agentDetails) return;

    setNodes((prev) =>
      prev.map((n) =>
        n.id !== "2"
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                label: (
                  <div className="agent-content">
                    <div className="title blue">Agent Details</div>
                    <div>
                      <strong>Description:</strong>{" "}
                      {agentDetails.agentDescription || "N/A"}
                    </div>
                    <div>
                      <strong>Model:</strong> {agentDetails.model_name || "N/A"}
                    </div>

                    <div className="button-center">
                      <button
                        className="toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails((prev) => !prev);
                        }}
                      >
                        {showDetails ? "Hide Summary" : "Show More"}
                      </button>
                    </div>

                    {showDetails && (
                      <div className="summary-box">
                        {Object.entries(agentDetails)
                          .filter(([key]) => key !== "agentPrompt")
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
            }
      )
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
    <div className="flow-container dark-bg">
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
        panOnScroll
        zoomOnScroll
      >
        <Background color="#1e293b" gap={20} />
        {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
      </ReactFlow>
    </div>
  );
}

export default SingleAgent;
