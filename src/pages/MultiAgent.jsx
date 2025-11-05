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
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [buttonNodes, setButtonNodes] = useState([]);
  const ref = useRef(null);
  const [allAgents, setAllAgents] = useState([]);
  const [visibleNodes, setVisibleNodes] = useState([0, 4, 9]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedApps, setExpandedApps] = useState({});
  const [visibleAppIndices, setVisibleAppIndices] = useState({});

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
  }, [visibleNodes, isExpanded, allAgents, expandedApps, visibleAppIndices]);

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

    // Add application child nodes for expanded agents
    const appNodes = [];
    const appEdges = [];
    const appButtonNodes = [];

    newNodes.forEach((agentNode) => {
      const agentIndex = agentNode.data.index;
      if (expandedApps[agentIndex]) {
        const agent = allAgents[agentIndex];
        const applications = agent.selected_applications || [];

        console.log(
          `Agent ${agentIndex + 1} has ${applications.length} applications:`,
          applications.map((app) => app.application_name)
        );

        // Initialize visible app indices if not set
        if (!visibleAppIndices[agentIndex] && applications.length > 0) {
          const lastIdx = applications.length - 1;
          const middleIdx = Math.floor(lastIdx / 2);
          setVisibleAppIndices((prev) => ({
            ...prev,
            [agentIndex]: [0, middleIdx, lastIdx],
          }));
          return;
        }

        const visibleApps = visibleAppIndices[agentIndex] || [];
        const sortedVisibleApps = [...visibleApps].sort((a, b) => a - b);

        sortedVisibleApps.forEach((appIdx, displayIdx) => {
          const app = applications[appIdx];
          const appId = `app-${agentIndex}-${appIdx}`;

          appNodes.push({
            id: appId,
            position: {
              x:
                agentNode.position.x +
                (displayIdx - (sortedVisibleApps.length - 1) / 2) * 160,
              y: agentNode.position.y + spacingY,
            },
            className: "app-node",
            style: { width: 130 },
            data: { application: app, agentIndex, appIndex: appIdx },
          });

          appEdges.push({
            id: `edge-${agentNode.id}-${appId}`,
            source: agentNode.id,
            target: appId,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });

        // Create three-dot buttons for apps
        if (applications.length > 3 && sortedVisibleApps.length > 0) {
          const firstAppNode = appNodes.find(
            (n) => n.id === `app-${agentIndex}-${sortedVisibleApps[0]}`
          );
          const middleAppNode = appNodes.find(
            (n) =>
              n.id ===
              `app-${agentIndex}-${
                sortedVisibleApps[Math.floor(sortedVisibleApps.length / 2)]
              }`
          );
          const lastAppNode = appNodes.find(
            (n) =>
              n.id ===
              `app-${agentIndex}-${
                sortedVisibleApps[sortedVisibleApps.length - 1]
              }`
          );

          if (firstAppNode && middleAppNode) {
            const leftAppIndices = [];
            for (
              let i = sortedVisibleApps[0] + 1;
              i < sortedVisibleApps[Math.floor(sortedVisibleApps.length / 2)];
              i++
            ) {
              leftAppIndices.push(i);
            }

            const leftHidden = leftAppIndices.filter(
              (idx) => !sortedVisibleApps.includes(idx)
            );
            const leftVisible = leftAppIndices.filter((idx) =>
              sortedVisibleApps.includes(idx)
            );
            const leftExpanded = leftHidden.length === 0;

            if (leftAppIndices.length > 0) {
              appButtonNodes.push({
                id: `btn-app-${agentIndex}-left`,
                type: "expandButton",
                position: {
                  x:
                    (firstAppNode.position.x + middleAppNode.position.x) / 2 -
                    25,
                  y: firstAppNode.position.y,
                },
                draggable: false,
                selectable: false,
                style: { width: 50, height: 40 },
                data: {
                  label: "...",
                  onClick: () =>
                    leftExpanded
                      ? handleHideApps(agentIndex, leftVisible)
                      : handleShowHiddenApps(agentIndex, leftHidden),
                },
              });
            }
          }

          if (middleAppNode && lastAppNode) {
            const rightAppIndices = [];
            for (
              let i =
                sortedVisibleApps[Math.floor(sortedVisibleApps.length / 2)] + 1;
              i < sortedVisibleApps[sortedVisibleApps.length - 1];
              i++
            ) {
              rightAppIndices.push(i);
            }

            const rightHidden = rightAppIndices.filter(
              (idx) => !sortedVisibleApps.includes(idx)
            );
            const rightVisible = rightAppIndices.filter((idx) =>
              sortedVisibleApps.includes(idx)
            );
            const rightExpanded = rightHidden.length === 0;

            if (rightAppIndices.length > 0) {
              appButtonNodes.push({
                id: `btn-app-${agentIndex}-right`,
                type: "expandButton",
                position: {
                  x:
                    (middleAppNode.position.x + lastAppNode.position.x) / 2 -
                    25,
                  y: middleAppNode.position.y,
                },
                draggable: false,
                selectable: false,
                style: { width: 50, height: 40 },
                data: {
                  label: "...",
                  onClick: () =>
                    rightExpanded
                      ? handleHideApps(agentIndex, rightVisible)
                      : handleShowHiddenApps(agentIndex, rightHidden),
                },
              });
            }
          }
        }
      }
    });

    setNodes((prev) => [
      prev.find((n) => n.id === "root"),
      ...newNodes,
      ...appNodes,
    ]);
    setEdges([...newEdges, ...appEdges]);

    setTimeout(() => {
      createButtons(newNodes, sortedVisible, appButtonNodes);
    }, 10);
  };

  const createButtons = (agentNodes, sortedVisible, appButtonNodes = []) => {
    const expandButtons = [];

    const node1 = agentNodes.find((n) => n.id === `agent-1`);
    const node5 = agentNodes.find((n) => n.id === `agent-5`);
    const node10 = agentNodes.find((n) => n.id === `agent-10`);

    if (!node1 || !node5 || !node10) return;

    const leftIndices = [1, 2, 3];
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

    const rightIndices = [5, 6, 7, 8];
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

    setButtonNodes([...expandButtons, ...appButtonNodes]);
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

  const handleShowHiddenApps = (agentIndex, hiddenAppIndices) => {
    setVisibleAppIndices((prev) => {
      const currentVisible = prev[agentIndex] || [];
      const newVisible = [...currentVisible, ...hiddenAppIndices];
      return {
        ...prev,
        [agentIndex]: [...new Set(newVisible)].sort((a, b) => a - b),
      };
    });
  };

  const handleHideApps = (agentIndex, appsToHide) => {
    setVisibleAppIndices((prev) => ({
      ...prev,
      [agentIndex]: (prev[agentIndex] || []).filter(
        (idx) => !appsToHide.includes(idx)
      ),
    }));
  };

  const handleAgentClick = (agent, e) => {
    e.stopPropagation();
    setSelectedAgent(agent);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  const toggleApps = (agentIndex, e) => {
    e.stopPropagation();
    setExpandedApps((prev) => ({
      ...prev,
      [agentIndex]: !prev[agentIndex],
    }));
  };

  const renderAgentNode = (agent, index) => {
    const hasApps =
      agent.selected_applications && agent.selected_applications.length > 0;
    const isAppsExpanded = expandedApps[index];

    return (
      <div className="agent-content tiny">
        <div
          onClick={(e) => handleAgentClick(agent, e)}
          style={{ cursor: "pointer" }}
        >
          <h4 className="title blue">Associated Agent</h4>
          <div>
            <b>Name:</b> {agent.agent_name || `Agent ${index + 1}`}
          </div>
        </div>
        {hasApps && (
          <button
            onClick={(e) => toggleApps(index, e)}
            style={{
              marginTop: "8px",
              padding: "5px 10px",
              fontSize: "11px",
              cursor: "pointer",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "500",
            }}
          >
            {isAppsExpanded ? "Hide Apps" : "Show Apps"}
          </button>
        )}
      </div>
    );
  };

  const renderAppNode = (app, appIndex) => (
    <div className="agent-content tiny">
      <h4 className="title blue" style={{ fontSize: "0.85rem" }}>
        Application
      </h4>
      <div style={{ fontSize: "0.8rem" }}>
        <b>Name:</b> {app.application_name || `App ${appIndex + 1}`}
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
      if (n.data?.application) {
        return {
          ...n,
          data: {
            ...n.data,
            label: renderAppNode(n.data.application, n.data.appIndex),
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

      {/* Agent Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: panelOpen ? 20 : -450,
          width: 400,
          maxHeight: "calc(100vh - 40px)",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          transition: "right 0.3s ease-in-out",
          zIndex: 1000,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f5f5f5",
          }}
        >
          <Typography variant="h6" color="primary" fontWeight="bold">
            Agent Details
          </Typography>
          <IconButton onClick={handleClosePanel} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedAgent && (
          <Box sx={{ p: 3, overflow: "auto", flex: 1 }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#2563eb", fontWeight: "bold" }}
            >
              {selectedAgent.agent_name || "Unnamed Agent"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#333" }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#666", lineHeight: 1.6 }}
              >
                {selectedAgent.description || "No description available"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#333" }}
              >
                Model Name
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#666",
                  bgcolor: "#f0f0f0",
                  p: 1.5,
                  borderRadius: 1,
                  fontFamily: "monospace",
                }}
              >
                {selectedAgent.model_name || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#333" }}
              >
                Prompt Template
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  bgcolor: "#f5f5f5",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "#444",
                  border: "1px solid #e0e0e0",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                {selectedAgent.prompt_template ||
                  "No prompt template available"}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default MultiAgent;
