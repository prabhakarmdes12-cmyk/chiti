import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ChitiApp from "./chiti.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChitiApp />
  </StrictMode>
);
