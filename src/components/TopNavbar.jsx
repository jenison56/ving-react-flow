import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

const TopNavbar = () => {
  return (
    <AppBar position="fixed" color="primary" elevation={2}>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Ving Multi-Agent Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavbar;
