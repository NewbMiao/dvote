import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App";
import theme from "./components/theme";
import React from "react";
import Layout from "./components/Layout";
import AuthProvider from "./components/AuthProvider";

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement!);

root.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    <Layout>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Layout>
  </ThemeProvider>
);
