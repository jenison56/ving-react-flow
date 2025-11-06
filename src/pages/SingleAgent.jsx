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
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function SingleAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [menu, setMenu] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [appPanelOpen, setAppPanelOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [apiDetailsPanelOpen, setApiDetailsPanelOpen] = useState(false);
  const [expandedApps, setExpandedApps] = useState({});
  const [allApplications, setAllApplications] = useState([]);
  const ref = useRef(null);

  const handleAgentClick = (agent, e) => {
    e.stopPropagation();
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
    setSelectedAgent(agent);
    setAgentPanelOpen(true);
  };

  const handleCloseAgentPanel = () => {
    setAgentPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  const handleAppClick = (app, e) => {
    e.stopPropagation();
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
    setSelectedApplication(app);
    setAppPanelOpen(true);
  };

  const handleCloseAppPanel = () => {
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleApiClick = (api, e) => {
    e.stopPropagation();
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
    setSelectedApi(api);
    setApiDetailsPanelOpen(true);
  };

  const handleCloseApiDetailsPanel = () => {
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
  };

  const toggleApis = (appIndex, e) => {
    e.stopPropagation();
    setExpandedApps((prev) => ({
      ...prev,
      [appIndex]: !prev[appIndex],
    }));
  };

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
        const selectedApplications = data?.selected_applications || [];

        setAllApplications(selectedApplications);

        // Parent Node - Agent Name
        const parentNode = {
          id: "1",
          position: { x: 700, y: 0 },
          style: { width: 460 },
          className: "root-node",
          data: {
            label: (
              <div
                className="root-label"
                onClick={(e) => handleAgentClick(agent, e)}
                style={{ cursor: "pointer" }}
              >
                <h3 className="title blue">
                  {agent.agentName || "YouFibre Sales Agent"}
                </h3>
              </div>
            ),
            agent,
          },
        };

        // Application Nodes
        const spacingX = 320;
        const startY = 200;
        const totalApps = selectedApplications.length;
        const startX = 700 - ((totalApps - 1) * spacingX) / 2;

        const appNodes = selectedApplications.map((app, index) => {
          const hasApis = app.selected_apis && app.selected_apis.length > 0;
          const isApisExpanded = expandedApps[index];

          return {
            id: `app-${index}`,
            position: { x: startX + index * spacingX, y: startY },
            style: { width: 280, padding: "15px" },
            className: "app-node",
            data: {
              label: (
                <div className="agent-content">
                  <div
                    onClick={(e) => handleAppClick(app, e)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="title cyan"
                      style={{ marginBottom: "10px" }}
                    >
                      Selected Application
                    </div>
                    <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>application_name:</strong>{" "}
                        {app.application_name}
                      </div>
                    </div>
                  </div>
                  {hasApis && (
                    <button
                      onClick={(e) => toggleApis(index, e)}
                      style={{
                        marginTop: "8px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        cursor: "pointer",
                        backgroundColor: "#0891b2",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "500",
                        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {isApisExpanded ? "Hide APIs" : "Show APIs"}
                    </button>
                  )}
                </div>
              ),
              application: app,
              appIndex: index,
            },
          };
        });

        // API Nodes
        const apiNodes = [];
        const apiEdges = [];

        appNodes.forEach((appNode) => {
          const appIndex = appNode.data.appIndex;
          if (expandedApps[appIndex]) {
            const app = selectedApplications[appIndex];
            const apis = app.selected_apis || [];

            const apiSpacingX = 200;
            const apiStartY = startY + 220;
            const totalApis = apis.length;
            const apiStartX =
              appNode.position.x - ((totalApis - 1) * apiSpacingX) / 2;

            apis.forEach((api, apiIdx) => {
              const apiId = `api-${appIndex}-${apiIdx}`;

              apiNodes.push({
                id: apiId,
                position: { x: apiStartX + apiIdx * apiSpacingX, y: apiStartY },
                style: { width: 180, padding: "10px" },
                className: "api-node",
                data: {
                  label: (
                    <div
                      className="agent-content"
                      onClick={(e) => handleApiClick(api, e)}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        className="title purple"
                        style={{ marginBottom: "8px", fontSize: "12px" }}
                      >
                        Selected API
                      </div>
                      <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>ID:</strong> {api.id || apiIdx}
                        </div>
                      </div>
                    </div>
                  ),
                  api,
                },
              });

              apiEdges.push({
                id: `e-${appNode.id}-${apiId}`,
                source: appNode.id,
                target: apiId,
                style: { stroke: "#818cf8", strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#818cf8" },
              });
            });
          }
        });

        const edges = appNodes.map((node) => ({
          id: `e1-${node.id}`,
          source: "1",
          target: node.id,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        }));

        if (isExpanded) {
          setNodes([parentNode, ...appNodes, ...apiNodes]);
          setEdges([...edges, ...apiEdges]);
        } else {
          setNodes([parentNode]);
          setEdges([]);
        }
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, [setNodes, setEdges, isExpanded, expandedApps]);

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

      {/* Agent Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: agentPanelOpen ? 20 : -450,
          width: 400,
          maxHeight: "calc(100vh - 40px)",
          bgcolor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.3), 0 0 15px rgba(96, 165, 250, 0.1)",
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
            borderBottom: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#60a5fa", fontWeight: "bold" }}
          >
            Agent Details
          </Typography>
          <IconButton
            onClick={handleCloseAgentPanel}
            size="small"
            sx={{ color: "#cbd5e1", "&:hover": { color: "#60a5fa" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedAgent && (
          <Box sx={{ p: 3, overflow: "auto", flex: 1, bgcolor: "#1e293b" }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#60a5fa", fontWeight: "bold" }}
            >
              {selectedAgent.agentName || "Unnamed Agent"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Model Name
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#dbeafe",
                  bgcolor: "#1e3a8a",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #3b82f6",
                  fontFamily: "monospace",
                }}
              >
                {selectedAgent.model_name || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Agent App URL
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#dbeafe",
                  bgcolor: "#1e3a8a",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #3b82f6",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}
              >
                {selectedAgent.agentAppUrl || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Document Name
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#dbeafe",
                  bgcolor: "#1e3a8a",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #3b82f6",
                  fontFamily: "monospace",
                }}
              >
                {selectedAgent.documentName || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Agent Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedAgent.agentDescription || "No description available"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Agent Prompt
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  bgcolor: "#1e3a8a",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "#dbeafe",
                  border: "1px solid #3b82f6",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                {selectedAgent.agentPrompt || "No prompt available"}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Application Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: appPanelOpen ? 20 : -450,
          width: 400,
          maxHeight: "calc(100vh - 40px)",
          bgcolor: "#1e293b",
          border: "1px solid #0891b2",
          borderRadius: "10px",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.3), 0 0 15px rgba(8, 145, 178, 0.1)",
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
            borderBottom: "1px solid #0891b2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#22d3ee", fontWeight: "bold" }}
          >
            Application Details
          </Typography>
          <IconButton
            onClick={handleCloseAppPanel}
            size="small"
            sx={{ color: "#cbd5e1", "&:hover": { color: "#22d3ee" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedApplication && (
          <Box sx={{ p: 3, overflow: "auto", flex: 1, bgcolor: "#1e293b" }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#22d3ee", fontWeight: "bold" }}
            >
              {selectedApplication.application_name || "Unnamed Application"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#67e8f9" }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedApplication.description || "No description available"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#67e8f9" }}
              >
                Version
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#cffafe",
                  bgcolor: "#164e63",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #0891b2",
                  fontFamily: "monospace",
                }}
              >
                {selectedApplication.version || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#67e8f9" }}
              >
                Selected APIs
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#cffafe",
                  bgcolor: "#164e63",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #0891b2",
                  fontFamily: "monospace",
                }}
              >
                {selectedApplication.selected_apis?.length || 0} APIs
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* API Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: apiDetailsPanelOpen ? 20 : -450,
          width: 400,
          maxHeight: "calc(100vh - 40px)",
          bgcolor: "#1e293b",
          border: "1px solid #6366f1",
          borderRadius: "10px",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.3), 0 0 15px rgba(99, 102, 241, 0.1)",
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
            borderBottom: "1px solid #6366f1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#1e293b",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#818cf8", fontWeight: "bold" }}
          >
            API Details
          </Typography>
          <IconButton
            onClick={handleCloseApiDetailsPanel}
            size="small"
            sx={{ color: "#cbd5e1", "&:hover": { color: "#818cf8" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedApi && (
          <Box sx={{ p: 3, overflow: "auto", flex: 1, bgcolor: "#1e293b" }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#818cf8", fontWeight: "bold" }}
            >
              ID: {selectedApi.id || "N/A"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                API Endpoint
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#e0e7ff",
                  bgcolor: "#312e81",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #6366f1",
                  fontFamily: "monospace",
                }}
              >
                {selectedApi.Api || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                Method
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#e0e7ff",
                  bgcolor: "#312e81",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #6366f1",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                }}
              >
                {selectedApi.method || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                Parameters
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  bgcolor: "#312e81",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "#e0e7ff",
                  border: "1px solid #6366f1",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {selectedApi.parameters || "No parameters"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                Request Body
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  bgcolor: "#312e81",
                  p: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "#e0e7ff",
                  border: "1px solid #6366f1",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {selectedApi.request_body || "No request body"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                Summary
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedApi.summary || "No summary available"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#a5b4fc" }}
              >
                User Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedApi.user_description || "No description available"}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default SingleAgent;
