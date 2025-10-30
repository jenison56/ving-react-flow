import "../App.css";
import "reactflow/dist/style.css";
import React, { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initialNodes, initialEdges } from "../initialElements";

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const ref = useRef(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentName = "Router Agent Multi";
        const response = await fetch(
          `http://68.233.117.127:2090/api/agent-payload/latest/${agentName}`,
          {
            headers: {
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ0ZW5hbnRfaWQiOjEsImV4cCI6MTc2MTg2NTU2Nn0.-REv3f3sHMTXuJNl-bS3lmNk1l7JW3-LACcnmu127dk",
            },
          }
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        const rootNode = {
          id: "1",
          position: { x: 700, y: 0 },
          style: {
            width: 220,
            padding: "12px",
            border: "2px solid #007bff",
            borderRadius: "12px",
            backgroundColor: "#e6f0ff",
            textAlign: "center",
            fontWeight: "bold",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          },
          data: { label: data.agent_name || agentName },
        };

        const associatedAgents =
          data?.configuration?.agent_data?.router_agent?.associated_agents ||
          [];

        const spacingX = 420;
        const totalWidth = (associatedAgents.length - 1) * spacingX;
        const startX = 700 - totalWidth / 2;

        const childNodes = associatedAgents.map((agent, index) => ({
          id: String(index + 2),
          position: { x: startX + index * spacingX, y: 300 },
          style: {
            width: 380,
            padding: "14px",
            border: "1px solid #ccc",
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
          },
          data: { agent, expanded: false },
        }));

        const newEdges = childNodes.map((node) => ({
          id: `e1-${node.id}`,
          source: "1",
          target: node.id,
          type: "smoothstep",
          style: { strokeWidth: 2 },
        }));

        setNodes([rootNode, ...childNodes]);
        setEdges(newEdges);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, []);

  // ✅ Utility to recursively remove nodes & edges
  const removeDescendants = (baseIds, allNodes, allEdges) => {
    let idsToRemove = new Set(baseIds);
    let changed = true;

    while (changed) {
      changed = false;
      allEdges.forEach((edge) => {
        if (idsToRemove.has(edge.source) && !idsToRemove.has(edge.target)) {
          idsToRemove.add(edge.target);
          changed = true;
        }
      });
    }

    const remainingNodes = allNodes.filter((n) => !idsToRemove.has(n.id));
    const remainingEdges = allEdges.filter(
      (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target)
    );

    return { remainingNodes, remainingEdges };
  };

  // 🔹 Toggle Applications
  const handleToggleApplications = (nodeId, agent) => {
    const selectedApps = agent.selectedApplications || [];

    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === nodeId);
      if (!node) return prevNodes;

      const isExpanded = node.data.expanded;

      if (!isExpanded) {
        const newNodes = [];
        const newEdges = [];

        selectedApps.forEach((app, index) => {
          const appId = app.id || `${nodeId}-app-${index}`;
          if (prevNodes.find((n) => n.id === appId)) return;

          newNodes.push({
            id: appId,
            position: {
              x: node.position.x + index * 260 - selectedApps.length * 100,
              y: node.position.y + 230,
            },
            style: {
              width: 340,
              padding: "14px",
              border: "1px solid #007bff",
              borderRadius: "10px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            },
            data: { app, expanded: false },
          });

          newEdges.push({
            id: `e-${nodeId}-${appId}`,
            source: nodeId,
            target: appId,
            type: "smoothstep",
            style: { strokeWidth: 2 },
          });
        });

        setEdges((prev) => [...prev, ...newEdges]);
        return [
          ...prevNodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, expanded: true } } : n
          ),
          ...newNodes,
        ];
      } else {
        // ✅ Collapse & clean all descendants (apps + APIs)
        setEdges((prevEdges) => {
          const { remainingNodes, remainingEdges } = removeDescendants(
            selectedApps.map((a) => a.id),
            prevNodes,
            prevEdges
          );

          setNodes(
            remainingNodes.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, expanded: false } }
                : n
            )
          );
          return remainingEdges;
        });
        return prevNodes;
      }
    });
  };

  // 🔹 Toggle APIs
  const handleToggleApis = (appId, app) => {
    const selectedApis = app.selectedApis || [];
    if (!selectedApis.length) return alert("No selected APIs found");

    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === appId);
      if (!node) return prevNodes;

      const isExpanded = node.data.expanded;

      if (!isExpanded) {
        const newNodes = [];
        const newEdges = [];

        selectedApis.forEach((api, index) => {
          const apiId = `${appId}-api-${index}`;
          if (prevNodes.find((n) => n.id === apiId)) return;

          newNodes.push({
            id: apiId,
            position: {
              x: node.position.x + index * 250 - selectedApis.length * 100,
              y: node.position.y + 220,
            },
            style: {
              width: 360,
              padding: "12px",
              border: "1px solid #28a745",
              borderRadius: "10px",
              backgroundColor: "#f8fff8",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            },
            data: { api },
          });

          newEdges.push({
            id: `e-${appId}-${apiId}`,
            source: appId,
            target: apiId,
            type: "smoothstep",
            style: { strokeWidth: 2 },
          });
        });

        setEdges((prev) => [...prev, ...newEdges]);
        return [
          ...prevNodes.map((n) =>
            n.id === appId ? { ...n, data: { ...n.data, expanded: true } } : n
          ),
          ...newNodes,
        ];
      } else {
        // ✅ Clean up APIs and their edges
        setEdges((prevEdges) => {
          const { remainingNodes, remainingEdges } = removeDescendants(
            selectedApis.map((_, i) => `${appId}-api-${i}`),
            prevNodes,
            prevEdges
          );

          setNodes(
            remainingNodes.map((n) =>
              n.id === appId
                ? { ...n, data: { ...n.data, expanded: false } }
                : n
            )
          );
          return remainingEdges;
        });
        return prevNodes;
      }
    });
  };

  // 🔹 Renderers
  const renderAgentNode = (agent, nodeId, expanded) => (
    <div style={{ fontSize: "13px", textAlign: "left" }}>
      <b>{agent.agent_name || "Unnamed Agent"}</b>
      <div>Description: {agent.description || "N/A"}</div>
      <div>Model: {agent.model_name || "N/A"}</div>
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          onClick={() => handleToggleApplications(nodeId, agent)}
          style={{
            padding: "6px 10px",
            background: expanded ? "#dc3545" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {expanded ? "Hide Applications" : "Show Applications"}
        </button>
      </div>
    </div>
  );

  const renderAppNode = (app, expanded, appId) => (
    <div style={{ fontSize: "13px" }}>
      <b>Selected Applications</b>
      <div>Name: {app.name || "Unnamed"}</div>
      <div>ID: {app.id}</div>
      <div style={{ textAlign: "center", marginTop: "8px" }}>
        <button
          onClick={() => handleToggleApis(appId, app)}
          style={{
            padding: "4px 10px",
            backgroundColor: expanded ? "#dc3545" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {expanded ? "Hide Selected APIs" : "Show Selected APIs"}
        </button>
      </div>
    </div>
  );

  const renderApiNode = (api) => (
    <div style={{ fontSize: "12px" }}>
      <b>Selected APIs</b>
      <div>
        <b>Name:</b> {api.Api || "Unnamed"}
      </div>
      <div>
        <b>Method:</b> {api.method?.toUpperCase()}
      </div>
      <div>
        <b>ID:</b> {api.id}
      </div>
      <div
        style={{
          maxHeight: "100px",
          overflowY: "auto",
          background: "#f9f9f9",
          padding: "6px",
          borderRadius: "6px",
          fontSize: "11px",
          marginTop: "6px",
        }}
      >
        <b>Summary:</b> {api.summary || "No summary"}
      </div>
    </div>
  );

  const updatedNodes = nodes.map((node) => {
    if (node.data?.agent)
      return {
        ...node,
        data: {
          ...node.data,
          label: renderAgentNode(node.data.agent, node.id, node.data.expanded),
        },
      };
    if (node.data?.app)
      return {
        ...node,
        data: {
          ...node.data,
          label: renderAppNode(node.data.app, node.data.expanded, node.id),
        },
      };
    if (node.data?.api)
      return {
        ...node,
        data: { ...node.data, label: renderApiNode(node.data.api) },
      };
    return node;
  });

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [setEdges]
  );

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        ref={ref}
        nodes={updatedNodes}
        edges={edges}
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
