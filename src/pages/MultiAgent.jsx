import "../App.css";
import "./MultiAgent.css";
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

function MultiAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ0ZW5hbnRfaWQiOjEsImV4cCI6MTc2MjE4NDcxN30.bC5476gfxOMiRnE4CVYE0fmSC22d5NH4sOz54H5yBpo",
            },
          }
        );
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();

        const rootNode = {
          id: "1",
          position: { x: 700, y: 0 },
          style: { width: 460 },
          className: "root-node",
          data: {
            label: data.agent_name || agentName,
            expanded: false,
            associatedAgents:
              data?.configuration?.agent_data?.router_agent
                ?.associated_agents || [],
          },
        };

        setNodes([rootNode]);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, []);

  const removeDescendants = (rootIds, allNodes, allEdges) => {
    let idsToRemove = new Set(rootIds);
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

    const newNodes = allNodes.filter((n) => !idsToRemove.has(n.id));
    const newEdges = allEdges.filter(
      (e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target)
    );

    return { newNodes, newEdges };
  };

  const handleParentClick = (node) => {
    const { expanded, associatedAgents } = node.data;
    if (!associatedAgents.length) return;

    if (!expanded) {
      const spacingX = 550;
      const spacingY = 350;
      const totalWidth = (associatedAgents.length - 1) * spacingX;
      const startX = node.position.x - totalWidth / 2;

      const newNodes = associatedAgents.map((agent, index) => ({
        id: `agent-${index + 1}`,
        position: {
          x: startX + index * spacingX,
          y: node.position.y + spacingY,
        },
        className: "agent-node",
        style: { width: 460 },
        data: { agent, expanded: false },
      }));

      const newEdges = newNodes.map((n) => ({
        id: `edge-1-${n.id}`,
        source: "1",
        target: n.id,
      }));

      setNodes((prev) =>
        prev
          .map((n) =>
            n.id === "1" ? { ...n, data: { ...n.data, expanded: true } } : n
          )
          .concat(newNodes)
      );
      setEdges((prev) => [...prev, ...newEdges]);
    } else {
      const agentIds = nodes
        .filter((n) => n.id.startsWith("agent-"))
        .map((n) => n.id);
      const { newNodes, newEdges } = removeDescendants(agentIds, nodes, edges);
      setNodes(
        newNodes.map((n) =>
          n.id === "1" ? { ...n, data: { ...n.data, expanded: false } } : n
        )
      );
      setEdges(newEdges);
    }
  };

  const handleToggleApplications = (nodeId, agent) => {
    const selectedApps = agent.selectedApplications || [];
    if (!selectedApps.length) return alert("No selected applications found");

    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === nodeId);
      if (!node) return prevNodes;

      const isExpanded = node.data.expanded;
      const spacingY = 350;
      const offsetX = 250;

      if (!isExpanded) {
        const newNodes = [];
        const newEdges = [];

        selectedApps.forEach((app, index) => {
          const isRight =
            app.name?.toLowerCase().includes("digi") ||
            app.name?.toLowerCase().includes("twin");
          const direction = isRight ? 1 : -1;
          const appId = `${nodeId}-app-${index}`;
          const xShift = direction * (offsetX + index * 60);

          newNodes.push({
            id: appId,
            position: {
              x: node.position.x + xShift,
              y: node.position.y + spacingY,
            },
            className: "app-node",
            style: { width: 460 },
            data: { app, expanded: false },
          });

          newEdges.push({
            id: `edge-${nodeId}-${appId}`,
            source: nodeId,
            target: appId,
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
        const removeIds = selectedApps.map((_, i) => `${nodeId}-app-${i}`);
        const { newNodes, newEdges } = removeDescendants(
          removeIds,
          prevNodes,
          edges
        );
        setEdges(newEdges);
        return newNodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, expanded: false } } : n
        );
      }
    });
  };

  const handleToggleApis = (appId, app) => {
    const selectedApis = app.selectedApis || [];
    if (!selectedApis.length) return alert("No selected APIs found");

    setNodes((prevNodes) => {
      const node = prevNodes.find((n) => n.id === appId);
      if (!node) return prevNodes;

      const isExpanded = node.data.expanded;
      const spacingY = 280;
      const spacingX = 500;

      if (!isExpanded) {
        const newNodes = [];
        const newEdges = [];

        selectedApis.forEach((api, index) => {
          const apiId = `${appId}-api-${index}`;
          const offsetX = (index - (selectedApis.length - 1) / 2) * spacingX;

          newNodes.push({
            id: apiId,
            position: {
              x: node.position.x + offsetX,
              y: node.position.y + spacingY,
            },
            className: "api-node",
            style: { width: 460 },
            data: { api },
          });
          newEdges.push({
            id: `edge-${appId}-${apiId}`,
            source: appId,
            target: apiId,
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
        const removeIds = selectedApis.map((_, i) => `${appId}-api-${i}`);
        const { newNodes, newEdges } = removeDescendants(
          removeIds,
          prevNodes,
          edges
        );
        setEdges(newEdges);
        return newNodes.map((n) =>
          n.id === appId ? { ...n, data: { ...n.data, expanded: false } } : n
        );
      }
    });
  };

  const renderAgentNode = (agent, nodeId, expanded) => (
    <div className="agent-content">
      <h3 className="title">Associated Agent</h3>
      <b>Name:</b> {agent.agent_name}
      <div>Description: {agent.description}</div>
      <div>Model: {agent.model_name}</div>
      <div className="prompt-box">
        <b>Prompt:</b>
        <div className="prompt-text">{agent.prompt_template}</div>
      </div>
      <div className="button-center">
        <button
          className={`toggle-btn ${expanded ? "hide" : "show"}`}
          onClick={() => handleToggleApplications(nodeId, agent)}
        >
          {expanded ? "Hide Applications" : "Show Applications"}
        </button>
      </div>
    </div>
  );

  const renderAppNode = (app, expanded, appId) => (
    <div className="app-content">
      <h3 className="title green">Selected Application</h3>
      <b>Name:</b> {app.name} <br />
      <b>ID:</b> {app.id}
      <div className="button-center">
        <button
          className={`toggle-btn ${expanded ? "hide" : "show"}`}
          onClick={() => handleToggleApis(appId, app)}
        >
          {expanded ? "Hide APIs" : "Show APIs"}
        </button>
      </div>
    </div>
  );

  const renderApiNode = (api) => (
    <div className="api-content">
      <h3 className="title green">Selected API</h3>
      <b>Api:</b> {api.Api} <br />
      <b>Method:</b> {api.method?.toUpperCase()} <br />
      <b>ID:</b> {api.id} <br />
      <b>Parameters:</b> {api.parameters} <br />
      <div className="summary-box" onClick={(e) => e.stopPropagation()}>
        <b>Summary:</b> <br />
        {api.summary}
      </div>
    </div>
  );

  const updatedNodes = nodes.map((node) => {
    if (node.id === "1")
      return {
        ...node,
        data: {
          ...node.data,
          label: (
            <div onClick={() => handleParentClick(node)}>
              <h3 className="title blue">{node.data.label}</h3>
            </div>
          ),
        },
      };
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
    <div className="flow-container">
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
