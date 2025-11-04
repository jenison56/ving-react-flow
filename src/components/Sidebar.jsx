import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box,
  IconButton,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import Logo from "../assets/logo.png";

const drawerWidth = 240;
const collapsedWidth = 70;

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => setOpen(!open);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        height: "100vh",
        flexShrink: 0,
        transition: "width 0.3s ease",
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : collapsedWidth,
          height: "100vh",
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          borderRight: "1px solid #334155",
          boxShadow: "4px 0 10px rgba(0,0,0,0.4)",
          transition: "width 0.3s ease",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        },
      }}
    >
      {/* === Logo + Toggle === */}
      <Toolbar
        sx={{
          justifyContent: open ? "space-between" : "center",
          alignItems: "center",
          flexDirection: "row",
          py: 2,
          px: 2,
          gap: 1.5,
          background: "#1e293b",
          borderBottom: "1px solid #334155",
        }}
      >
        {open && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              component="img"
              src={Logo}
              alt="Ving Logo"
              sx={{
                width: 45,
                height: 45,
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                objectFit: "contain",
                boxShadow: "0 0 6px rgba(148,163,184,0.3)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#f8fafc",
                letterSpacing: "1px",
              }}
            >
              VING
            </Typography>
          </Box>
        )}

        <IconButton
          onClick={toggleDrawer}
          sx={{
            color: "#f8fafc",
            ml: open ? "auto" : 0,
            transition: "all 0.3s ease",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* === Navigation === */}
      <List sx={{ mt: 2, flexGrow: 1 }}>
        {/* Single Agent */}
        <ListItem
          disablePadding
          sx={{ justifyContent: open ? "flex-start" : "center" }}
        >
          <ListItemButton
            component={Link}
            to="/single-agent"
            selected={location.pathname === "/single-agent"}
            sx={{
              borderRadius: "8px",
              mx: 1,
              mb: 1,
              transition: "all 0.2s ease",
              color: "#e2e8f0",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                color: "#0f172a",
                fontWeight: "bold",
                boxShadow: "0 0 10px rgba(59,130,246,0.4)",
              },
              "&:hover": {
                background: "rgba(59,130,246,0.15)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === "/single-agent" ? "#0f172a" : "#e2e8f0",
                minWidth: "40px",
                justifyContent: "center",
              }}
            >
              <PersonIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Single Agent" />}
          </ListItemButton>
        </ListItem>

        {/* Multi Agent */}
        <ListItem
          disablePadding
          sx={{ justifyContent: open ? "flex-start" : "center" }}
        >
          <ListItemButton
            component={Link}
            to="/multi-agent"
            selected={location.pathname === "/multi-agent"}
            sx={{
              borderRadius: "8px",
              mx: 1,
              mb: 1,
              transition: "all 0.2s ease",
              color: "#e2e8f0",
              "&.Mui-selected": {
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                color: "#0f172a",
                fontWeight: "bold",
                boxShadow: "0 0 10px rgba(59,130,246,0.4)",
              },
              "&:hover": {
                background: "rgba(59,130,246,0.15)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color:
                  location.pathname === "/multi-agent" ? "#0f172a" : "#e2e8f0",
                minWidth: "40px",
                justifyContent: "center",
              }}
            >
              <GroupIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Multi Agent" />}
          </ListItemButton>
        </ListItem>
      </List>

      {/* === Footer === */}
      {open && (
        <Box
          sx={{
            py: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "rgba(248,250,252,0.5)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "#1e293b",
          }}
        >
          © 2025 Ving System
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;
