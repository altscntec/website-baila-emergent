import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { bootQuiz } from "@/quiz/earlyBoot";

// Moves the quiz verification token out of the URL before any analytics script can read it.
bootQuiz();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
