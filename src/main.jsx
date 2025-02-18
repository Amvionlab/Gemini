import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { UserProvider } from '../src/components/UserContext/UserContext';

ReactDOM.createRoot(document.getElementById("root")).render(
<UserProvider>
<App />
</UserProvider>
);
