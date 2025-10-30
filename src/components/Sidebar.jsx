import React from "react";
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
} from "@mui/material";
import { Link } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";

const drawerWidth = 240;

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "primary.main",
          color: "white",
        },
      }}
    >
      {/* Title Section */}
      <Toolbar
        sx={{
          justifyContent: "center",
          alignItems: "center",
          py: 2,
          backgroundColor: "primary.dark",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Ving Agents
        </Typography>
      </Toolbar>

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

      {/* Navigation Links */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/single-agent"
            sx={{
              "&:hover": { backgroundColor: "primary.light" },
              color: "inherit",
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Single Agent" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/multi-agent"
            sx={{
              "&:hover": { backgroundColor: "primary.light" },
              color: "inherit",
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Multi Agent" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
