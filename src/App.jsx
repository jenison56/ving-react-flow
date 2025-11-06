import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import Sidebar from "./components/Sidebar";
import SingleAgent from "./pages/SingleAgent";
import MultiAgent from "./pages/MultiAgent";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1e1e2f",
      light: "#3a3a4d",
      dark: "#12121c",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />

        <Box
          sx={{
            display: "flex",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            margin: 0,
            padding: 0,
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Sidebar */}
          <Sidebar />

          {/* Main ReactFlow content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: "100%",
              width: "100%",
              overflow: "hidden",
              background: "transparent",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Routes>
              <Route path="/single-agent" element={<SingleAgent />} />
              <Route path="/multi-agent" element={<MultiAgent />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
