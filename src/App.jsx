import React from "react";
import Default from "./pages/Default";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import SingleAgent from "./pages/SingleAgent";
import MultiAgent from "./pages/MultiAgent";

const App = () => {
  return (
    <div>
      {/* <Default /> */}
      <BrowserRouter>
        <nav>
          <Link to="/single-agent">single</Link> |{" "}
          <Link to="/multi-agent">multi</Link>
        </nav>

        <Routes>
          {/* <Route path="/" element={<Default />} /> */}
          <Route path="/single-agent" element={<SingleAgent />} />
          <Route path="/multi-agent" element={<MultiAgent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
