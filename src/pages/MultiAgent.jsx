import "../App.css";
import "./pages.css";
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
  const [rootAgent, setRootAgent] = useState(null);
  const [rootAgentName, setRootAgentName] = useState("Router Agent Multi");
  const [visibleNodes, setVisibleNodes] = useState([0, 4, 9]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRootAgent, setSelectedRootAgent] = useState(null);
  const [rootPanelOpen, setRootPanelOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [appPanelOpen, setAppPanelOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [apiDetailsPanelOpen, setApiDetailsPanelOpen] = useState(false);
  const [expandedApps, setExpandedApps] = useState({});
  const [visibleAppIndices, setVisibleAppIndices] = useState({});
  const [expandedApis, setExpandedApis] = useState({});
  const [visibleApiIndices, setVisibleApiIndices] = useState({});

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const res = await fetch("/router_agent_multi_10_agents.json");
        if (!res.ok) throw new Error("Failed to load local JSON");
        const data = await res.json();

        const agentName = data.agent_name || "Router Agent Multi";
        const routerAgentData =
          data?.configuration?.agent_data?.router_agent || {};
        const associatedAgents = routerAgentData?.associated_agents || [];

        setRootAgentName(agentName);
        setRootAgent(routerAgentData);
        setAllAgents(associatedAgents);

        setNodes([
          {
            id: "root",
            position: { x: 700, y: 0 },
            style: { width: 340 },
            className: "root-node",
            data: {
              label: agentName,
              expanded: true,
              rootAgent: routerAgentData,
            },
          },
        ]);
      } catch (err) {
        console.error("Error loading JSON:", err);
      }
    };
    fetchAgentData();
  }, [setNodes]);

  useEffect(() => {
    if (isExpanded && allAgents.length > 0 && nodes.length > 0) {
      const rootNode = nodes.find((n) => n.id === "root");
      if (rootNode) {
        updateNodesAndButtons();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleNodes,
    isExpanded,
    allAgents.length,
    expandedApps,
    visibleAppIndices,
    expandedApis,
    visibleApiIndices,
    nodes.length,
  ]);

  const handleParentClick = (e) => {
    e.stopPropagation();
    setPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
    setSelectedRootAgent(rootAgent);
    setRootPanelOpen(true);
  };

  const handleCloseRootPanel = () => {
    setRootPanelOpen(false);
    setTimeout(() => setSelectedRootAgent(null), 300);
  };

  const updateNodesAndButtons = () => {
    const rootNode = nodes.find((n) => n.id === "root");
    if (!rootNode || allAgents.length === 0) {
      console.warn("updateNodesAndButtons: Missing rootNode or allAgents");
      return;
    }

    const spacingX = 420;
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
        style: { width: 280 },
        data: { agent, index: agentIndex },
      };
    });

    const newEdges = newNodes.map((n) => ({
      id: `edge-root-${n.id}`,
      source: "root",
      target: n.id,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
      style: { stroke: "#60a5fa" },
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
                (displayIdx - (sortedVisibleApps.length - 1) / 2) * 260,
              y: agentNode.position.y + spacingY + 60,
            },
            className: "app-node",
            style: { width: 180 },
            data: { application: app, agentIndex, appIndex: appIdx },
          });

          appEdges.push({
            id: `edge-${agentNode.id}-${appId}`,
            source: agentNode.id,
            target: appId,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
            style: { stroke: "#22d3ee" },
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
              // Calculate button position - find the actual nodes to position between
              let leftAppButtonX;

              // Find the node just before the middle node in the visible list
              const middleIndex =
                sortedVisibleApps[Math.floor(sortedVisibleApps.length / 2)];
              const visibleBeforeMiddle = sortedVisibleApps.filter(
                (idx) => idx < middleIndex
              );

              if (visibleBeforeMiddle.length > 0) {
                const nodeBeforeMiddleIdx =
                  visibleBeforeMiddle[visibleBeforeMiddle.length - 1];
                const nodeBeforeMiddle = appNodes.find(
                  (n) => n.id === `app-${agentIndex}-${nodeBeforeMiddleIdx}`
                );
                if (nodeBeforeMiddle) {
                  leftAppButtonX =
                    (nodeBeforeMiddle.position.x + middleAppNode.position.x) /
                      2 +
                    (nodeBeforeMiddle.style?.width || 180) / 2 -
                    25;
                } else {
                  leftAppButtonX =
                    (firstAppNode.position.x + middleAppNode.position.x) / 2 +
                    (firstAppNode.style?.width || 180) / 2 -
                    25;
                }
              } else {
                leftAppButtonX =
                  (firstAppNode.position.x + middleAppNode.position.x) / 2 +
                  (firstAppNode.style?.width || 180) / 2 -
                  25;
              }

              appButtonNodes.push({
                id: `btn-app-${agentIndex}-left`,
                type: "expandButton",
                position: {
                  x: leftAppButtonX,
                  y: firstAppNode.position.y + 35,
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
              // Calculate button position - find the actual nodes to position between
              let rightAppButtonX;

              // Find the node just after the middle node in the visible list
              const middleIndex =
                sortedVisibleApps[Math.floor(sortedVisibleApps.length / 2)];
              const visibleAfterMiddle = sortedVisibleApps.filter(
                (idx) => idx > middleIndex
              );

              if (visibleAfterMiddle.length > 0) {
                const nodeAfterMiddleIdx = visibleAfterMiddle[0];
                const nodeAfterMiddle = appNodes.find(
                  (n) => n.id === `app-${agentIndex}-${nodeAfterMiddleIdx}`
                );
                if (nodeAfterMiddle) {
                  rightAppButtonX =
                    (middleAppNode.position.x + nodeAfterMiddle.position.x) /
                      2 +
                    (middleAppNode.style?.width || 180) / 2 -
                    25;
                } else {
                  rightAppButtonX =
                    (middleAppNode.position.x + lastAppNode.position.x) / 2 +
                    (middleAppNode.style?.width || 180) / 2 -
                    25;
                }
              } else {
                rightAppButtonX =
                  (middleAppNode.position.x + lastAppNode.position.x) / 2 +
                  (middleAppNode.style?.width || 180) / 2 -
                  25;
              }

              appButtonNodes.push({
                id: `btn-app-${agentIndex}-right`,
                type: "expandButton",
                position: {
                  x: rightAppButtonX,
                  y: middleAppNode.position.y + 35,
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

    // Add API child nodes for expanded applications
    const apiNodes = [];
    const apiEdges = [];
    const apiButtonNodes = [];

    appNodes.forEach((appNode) => {
      const { agentIndex, appIndex, application } = appNode.data;
      const appKey = `${agentIndex}-${appIndex}`;

      if (expandedApis[appKey]) {
        const apis = application.selected_apis || [];

        // Initialize visible API indices if not set
        if (!visibleApiIndices[appKey] && apis.length > 0) {
          const lastIdx = apis.length - 1;
          const middleIdx = Math.floor(lastIdx / 2);
          setVisibleApiIndices((prev) => ({
            ...prev,
            [appKey]: [0, middleIdx, lastIdx],
          }));
          return;
        }

        const visibleApis = visibleApiIndices[appKey] || [];
        const sortedVisibleApis = [...visibleApis].sort((a, b) => a - b);

        sortedVisibleApis.forEach((apiIdx, displayIdx) => {
          const api = apis[apiIdx];
          const apiId = `api-${agentIndex}-${appIndex}-${apiIdx}`;

          apiNodes.push({
            id: apiId,
            position: {
              x:
                appNode.position.x +
                (displayIdx - (sortedVisibleApis.length - 1) / 2) * 230,
              y: appNode.position.y + spacingY + 60,
            },
            className: "api-node",
            style: { width: 150 },
            data: { api, agentIndex, appIndex, apiIndex: apiIdx },
          });

          apiEdges.push({
            id: `edge-${appNode.id}-${apiId}`,
            source: appNode.id,
            target: apiId,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#818cf8" },
            style: { stroke: "#818cf8" },
          });
        });

        // Create three-dot buttons for APIs
        if (apis.length > 3 && sortedVisibleApis.length > 0) {
          const firstApiNode = apiNodes.find(
            (n) =>
              n.id === `api-${agentIndex}-${appIndex}-${sortedVisibleApis[0]}`
          );
          const middleApiNode = apiNodes.find(
            (n) =>
              n.id ===
              `api-${agentIndex}-${appIndex}-${
                sortedVisibleApis[Math.floor(sortedVisibleApis.length / 2)]
              }`
          );
          const lastApiNode = apiNodes.find(
            (n) =>
              n.id ===
              `api-${agentIndex}-${appIndex}-${
                sortedVisibleApis[sortedVisibleApis.length - 1]
              }`
          );

          if (firstApiNode && middleApiNode) {
            const leftApiIndices = [];
            for (
              let i = sortedVisibleApis[0] + 1;
              i < sortedVisibleApis[Math.floor(sortedVisibleApis.length / 2)];
              i++
            ) {
              leftApiIndices.push(i);
            }

            const leftHidden = leftApiIndices.filter(
              (idx) => !sortedVisibleApis.includes(idx)
            );
            const leftVisible = leftApiIndices.filter((idx) =>
              sortedVisibleApis.includes(idx)
            );
            const leftExpanded = leftHidden.length === 0;

            if (leftApiIndices.length > 0) {
              // Calculate button position - find the actual nodes to position between
              let leftApiButtonX;

              // Find the node just before the middle node in the visible list
              const middleIndex =
                sortedVisibleApis[Math.floor(sortedVisibleApis.length / 2)];
              const visibleBeforeMiddle = sortedVisibleApis.filter(
                (idx) => idx < middleIndex
              );

              if (visibleBeforeMiddle.length > 0) {
                const nodeBeforeMiddleIdx =
                  visibleBeforeMiddle[visibleBeforeMiddle.length - 1];
                const nodeBeforeMiddle = apiNodes.find(
                  (n) =>
                    n.id ===
                    `api-${agentIndex}-${appIndex}-${nodeBeforeMiddleIdx}`
                );
                if (nodeBeforeMiddle) {
                  leftApiButtonX =
                    (nodeBeforeMiddle.position.x + middleApiNode.position.x) /
                      2 +
                    (nodeBeforeMiddle.style?.width || 150) / 2 -
                    25;
                } else {
                  leftApiButtonX =
                    (firstApiNode.position.x + middleApiNode.position.x) / 2 +
                    (firstApiNode.style?.width || 150) / 2 -
                    25;
                }
              } else {
                leftApiButtonX =
                  (firstApiNode.position.x + middleApiNode.position.x) / 2 +
                  (firstApiNode.style?.width || 150) / 2 -
                  25;
              }

              apiButtonNodes.push({
                id: `btn-api-${agentIndex}-${appIndex}-left`,
                type: "expandButton",
                position: {
                  x: leftApiButtonX,
                  y: firstApiNode.position.y + 20,
                },
                draggable: false,
                selectable: false,
                style: { width: 50, height: 40 },
                data: {
                  label: "...",
                  onClick: () =>
                    leftExpanded
                      ? handleHideApis(appKey, leftVisible)
                      : handleShowHiddenApis(appKey, leftHidden),
                },
              });
            }
          }

          if (middleApiNode && lastApiNode) {
            const rightApiIndices = [];
            for (
              let i =
                sortedVisibleApis[Math.floor(sortedVisibleApis.length / 2)] + 1;
              i < sortedVisibleApis[sortedVisibleApis.length - 1];
              i++
            ) {
              rightApiIndices.push(i);
            }

            const rightHidden = rightApiIndices.filter(
              (idx) => !sortedVisibleApis.includes(idx)
            );
            const rightVisible = rightApiIndices.filter((idx) =>
              sortedVisibleApis.includes(idx)
            );
            const rightExpanded = rightHidden.length === 0;

            if (rightApiIndices.length > 0) {
              // Calculate button position - find the actual nodes to position between
              let rightApiButtonX;

              // Find the node just after the middle node in the visible list
              const middleIndex =
                sortedVisibleApis[Math.floor(sortedVisibleApis.length / 2)];
              const visibleAfterMiddle = sortedVisibleApis.filter(
                (idx) => idx > middleIndex
              );

              if (visibleAfterMiddle.length > 0) {
                const nodeAfterMiddleIdx = visibleAfterMiddle[0];
                const nodeAfterMiddle = apiNodes.find(
                  (n) =>
                    n.id ===
                    `api-${agentIndex}-${appIndex}-${nodeAfterMiddleIdx}`
                );
                if (nodeAfterMiddle) {
                  rightApiButtonX =
                    (middleApiNode.position.x + nodeAfterMiddle.position.x) /
                      2 +
                    (middleApiNode.style?.width || 150) / 2 -
                    25;
                } else {
                  rightApiButtonX =
                    (middleApiNode.position.x + lastApiNode.position.x) / 2 +
                    (middleApiNode.style?.width || 150) / 2 -
                    25;
                }
              } else {
                rightApiButtonX =
                  (middleApiNode.position.x + lastApiNode.position.x) / 2 +
                  (middleApiNode.style?.width || 150) / 2 -
                  25;
              }

              apiButtonNodes.push({
                id: `btn-api-${agentIndex}-${appIndex}-right`,
                type: "expandButton",
                position: {
                  x: rightApiButtonX,
                  y: middleApiNode.position.y + 20,
                },
                draggable: false,
                selectable: false,
                style: { width: 50, height: 40 },
                data: {
                  label: "...",
                  onClick: () =>
                    rightExpanded
                      ? handleHideApis(appKey, rightVisible)
                      : handleShowHiddenApis(appKey, rightHidden),
                },
              });
            }
          }
        }
      }
    });

    const currentRootNode = nodes.find((n) => n.id === "root");
    const allNodes = [currentRootNode, ...newNodes, ...appNodes, ...apiNodes];
    const allEdges = [...newEdges, ...appEdges, ...apiEdges];

    console.log("Setting nodes:", allNodes.length, "edges:", allEdges.length);
    setNodes(allNodes);
    setEdges(allEdges);

    setTimeout(() => {
      createButtons(newNodes, sortedVisible, appButtonNodes, apiButtonNodes);
    }, 10);
  };

  const createButtons = (
    agentNodes,
    sortedVisible,
    appButtonNodes = [],
    apiButtonNodes = []
  ) => {
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

    // Calculate button position based on expanded state
    let leftButtonX;
    if (leftExpanded) {
      // When expanded, position between the last visible left node and node5
      const lastLeftVisible = Math.max(
        ...leftIndices.filter((idx) => sortedVisible.includes(idx))
      );
      const lastLeftNode = agentNodes.find(
        (n) => n.id === `agent-${lastLeftVisible + 1}`
      );
      if (lastLeftNode) {
        leftButtonX =
          (lastLeftNode.position.x + node5.position.x) / 2 +
          (lastLeftNode.style?.width || 280) / 2 -
          25;
      } else {
        leftButtonX =
          (node1.position.x + node5.position.x) / 2 +
          (node1.style?.width || 280) / 2 -
          25;
      }
    } else {
      leftButtonX =
        (node1.position.x + node5.position.x) / 2 +
        (node1.style?.width || 280) / 2 -
        25;
    }

    expandButtons.push({
      id: `btn-toggle-before-5`,
      type: "expandButton",
      position: {
        x: leftButtonX,
        y: node1.position.y + 50,
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

    // Calculate button position based on expanded state
    let rightButtonX;
    if (rightExpanded) {
      // When expanded, position between node5 and the first visible right node
      const firstRightVisible = Math.min(
        ...rightIndices.filter((idx) => sortedVisible.includes(idx))
      );
      const firstRightNode = agentNodes.find(
        (n) => n.id === `agent-${firstRightVisible + 1}`
      );
      if (firstRightNode) {
        rightButtonX =
          (node5.position.x + firstRightNode.position.x) / 2 +
          (node5.style?.width || 280) / 2 -
          25;
      } else {
        rightButtonX =
          (node5.position.x + node10.position.x) / 2 +
          (node5.style?.width || 280) / 2 -
          25;
      }
    } else {
      rightButtonX =
        (node5.position.x + node10.position.x) / 2 +
        (node5.style?.width || 280) / 2 -
        25;
    }

    expandButtons.push({
      id: `btn-toggle-after-5`,
      type: "expandButton",
      position: {
        x: rightButtonX,
        y: node5.position.y + 50,
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

    setButtonNodes([...expandButtons, ...appButtonNodes, ...apiButtonNodes]);
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

  const handleShowHiddenApis = (appKey, hiddenApiIndices) => {
    setVisibleApiIndices((prev) => {
      const currentVisible = prev[appKey] || [];
      const newVisible = [...currentVisible, ...hiddenApiIndices];
      return {
        ...prev,
        [appKey]: [...new Set(newVisible)].sort((a, b) => a - b),
      };
    });
  };

  const handleHideApis = (appKey, apisToHide) => {
    setVisibleApiIndices((prev) => ({
      ...prev,
      [appKey]: (prev[appKey] || []).filter((idx) => !apisToHide.includes(idx)),
    }));
  };

  const handleAgentClick = (agent, e) => {
    e.stopPropagation();
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
    setSelectedAgent(agent);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  const handleAppClick = (app, e) => {
    e.stopPropagation();
    setPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
    setSelectedApplication(app);
    setAppPanelOpen(true);
  };

  const handleCloseAppPanel = () => {
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleApiNodeClick = (api, e) => {
    e.stopPropagation();
    setPanelOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
    setAppPanelOpen(false);
    setTimeout(() => setSelectedApplication(null), 300);
    setSelectedApi(api);
    setApiDetailsPanelOpen(true);
  };

  const handleCloseApiDetailsPanel = () => {
    setApiDetailsPanelOpen(false);
    setTimeout(() => setSelectedApi(null), 300);
  };

  const toggleApps = (agentIndex, e) => {
    e.stopPropagation();
    setExpandedApps((prev) => ({
      ...prev,
      [agentIndex]: !prev[agentIndex],
    }));
  };

  const toggleApis = (agentIndex, appIndex, e) => {
    e.stopPropagation();
    const appKey = `${agentIndex}-${appIndex}`;
    setExpandedApis((prev) => ({
      ...prev,
      [appKey]: !prev[appKey],
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
              padding: "6px 12px",
              fontSize: "11px",
              cursor: "pointer",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "500",
              boxShadow: "0 3px 6px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isAppsExpanded ? "Hide Apps" : "Show Apps"}
          </button>
        )}
      </div>
    );
  };

  const renderAppNode = (app, agentIndex, appIndex) => {
    const hasApis = app.selected_apis && app.selected_apis.length > 0;
    const appKey = `${agentIndex}-${appIndex}`;
    const isApisExpanded = expandedApis[appKey];

    return (
      <div className="agent-content tiny">
        <div
          onClick={(e) => handleAppClick(app, e)}
          style={{ cursor: "pointer" }}
        >
          <h4 className="title cyan" style={{ fontSize: "0.85rem" }}>
            Application
          </h4>
          <div style={{ fontSize: "0.8rem" }}>
            <b>Name:</b> {app.application_name || `App ${appIndex + 1}`}
          </div>
        </div>
        {hasApis && (
          <button
            onClick={(e) => toggleApis(agentIndex, appIndex, e)}
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
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#0e7490";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#0891b2";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isApisExpanded ? "Hide APIs" : "Show APIs"}
          </button>
        )}
      </div>
    );
  };

  const renderApiNode = (api, apiIndex) => (
    <div className="api-content tiny">
      <div
        onClick={(e) => handleApiNodeClick(api, e)}
        style={{ cursor: "pointer" }}
      >
        <h4 className="title indigo" style={{ fontSize: "0.75rem" }}>
          API
        </h4>
        <div style={{ fontSize: "0.75rem" }}>
          <b>ID:</b> {api.id || apiIndex}
        </div>
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
              <div onClick={handleParentClick} style={{ cursor: "pointer" }}>
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
            label: renderAppNode(
              n.data.application,
              n.data.agentIndex,
              n.data.appIndex
            ),
          },
        };
      }
      if (n.data?.api) {
        return {
          ...n,
          data: {
            ...n.data,
            label: renderApiNode(n.data.api, n.data.apiIndex),
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

      {/* Root Agent Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: rootPanelOpen ? 20 : -450,
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
            Router Agent Details
          </Typography>
          <IconButton
            onClick={handleCloseRootPanel}
            size="small"
            sx={{ color: "#cbd5e1", "&:hover": { color: "#60a5fa" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedRootAgent && (
          <Box sx={{ p: 3, overflow: "auto", flex: 1, bgcolor: "#1e293b" }}>
            <Typography
              variant="h5"
              sx={{ mb: 2, color: "#60a5fa", fontWeight: "bold" }}
            >
              {selectedRootAgent.agent_name || "Router Agent Multi"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedRootAgent.description || "No description available"}
              </Typography>
            </Box>

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
                {selectedRootAgent.model_name || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Base URL
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
                {selectedRootAgent.base_url || "Not specified"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Prompt Template
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
                {selectedRootAgent.prompt_template ||
                  "No prompt template available"}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Agent Details Side Panel */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: panelOpen ? 20 : -450,
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
            onClick={handleClosePanel}
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
              {selectedAgent.agent_name || "Unnamed Agent"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#cbd5e1", lineHeight: 1.6 }}
              >
                {selectedAgent.description || "No description available"}
              </Typography>
            </Box>

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

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1, color: "#93c5fd" }}
              >
                Prompt Template
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
                {selectedAgent.prompt_template ||
                  "No prompt template available"}
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

export default MultiAgent;
