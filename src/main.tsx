import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
