import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "react-hot-toast"; // ← НОВАЯ СТРОКА
import './utils/reactDevToolsPatch';

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <>
    <App />
    <Toaster position="top-right" />
  </>
);
