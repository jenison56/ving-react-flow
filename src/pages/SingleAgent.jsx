import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

// CSS imports removed from this file per developer request

import { initialNodes, initialEdges } from "../initialElements";
import ContextMenu from "../ContextMenu";

function SingleAgent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menu, setMenu] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const ref = useRef(null);

  // helper to safely pick first existing path from multiple possible payload shapes
  const pick = (obj, paths = []) => {
    for (const path of paths) {
      let cur = obj;
      for (const key of path) {
        if (cur == null) {
          cur = undefined;
          break;
        }
        cur = cur[key];
      }
      if (cur !== undefined && cur !== null) return cur;
    }
    return undefined;
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const agentName = "YouFibre Sales Agent";
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

        const agentDisplayName = data.agent_name || data.agentName || agentName;
        const rootNode = {
          id: "1",
          position: { x: 160, y: 40 },
          data: { label: <div>{agentDisplayName}</div> },
        };

        // prepare agent details
        const agentObj = pick(data, [
          ["configuration", "agent_data", "agent"],
          ["agent_data", "agent"],
          ["agent"],
        ]);
        // agentAppUrl is available in payload but not shown in node UI; omitted to avoid unused-vars lint
        const agentDescription = pick(data, [
          ["agentDescription"],
          ["agent_description"],
          ["configuration", "agent_data", "agent", "agentDescription"],
          ["agent", "agentDescription"],
        ]);

        const associatedAgents =
          data?.configuration?.agent_data?.router_agent?.associated_agents ||
          data?.configuration?.agent_data?.associated_agents ||
          data?.associated_agents ||
          [];
        let childNodes = [];
        if (associatedAgents && associatedAgents.length > 0) {
          childNodes = associatedAgents.map((agent, index) => {
            const url = pick(agent, [
              ["agentAppUrl"],
              ["agent", "agentAppUrl"],
              ["agent_data", "agent", "agentAppUrl"],
            ]);
            const desc = pick(agent, [
              ["agentDescription"],
              ["description"],
              ["agent", "agentDescription"],
            ]);
            return {
              id: String(index + 2),
              position: {
                x: 120 + index * 200 - (associatedAgents.length - 1) * 100,
                y: 220,
              },
              data: {
                label: (
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "primary.main",
                      minWidth: 250,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "text.primary", fontWeight: 600 }}
                      >
                        {agent.agent_name || agent.agentName || "Agent"}
                      </Typography>
                      {url && (
                        <Typography
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          variant="body2"
                          sx={{
                            color: "primary.main",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {url}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {desc || "No description"}
                      </Typography>
                    </Box>
                  </Paper>
                ),
              },
            };
          });
        } else if (agentObj) {
          // render single-agent details using the compact card layout requested
          const name =
            (agentObj && (agentObj.agent_name || agentObj.agentName)) ||
            data.agent_name ||
            "N/A";
          const description =
            agentObj?.description || agentDescription || "N/A";
          const model = agentObj?.model_name || agentObj?.model || "N/A";

          childNodes = [
            {
              id: "2",
              position: { x: 220, y: 220 },
              data: {
                label: (
                  <div style={{ fontSize: "12px" }}>
                    <div style={{ color: "#666" }}>
                      <div>Description: {description}</div>
                      <div>Model: {model}</div>
                    </div>
                  </div>
                ),
              },
            },
          ];
        }

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
  }, [setNodes, setEdges]);

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
      {agentData && null}
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
