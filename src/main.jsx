import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { EmpireProvider } from "./context/EmpireContext.jsx";
createRoot(document.getElementById("root")).render(
	<StrictMode>
		<EmpireProvider>
			<App />
		</EmpireProvider>
	</StrictMode>
);
