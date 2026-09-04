import React from "react";
import { createRoot } from "react-dom/client";
import MaskStudio from "./MaskStudio.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MaskStudio />
  </React.StrictMode>
);
