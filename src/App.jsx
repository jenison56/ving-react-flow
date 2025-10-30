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
      default: "#f5f5f5",
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />

        {/* Layout container */}
        <Box sx={{ display: "flex" }}>
          {/* Sidebar on the left */}
          <Sidebar />

          {/* Main content area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              backgroundColor: "background.default",
              minHeight: "100vh",
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
