import { useRouteError } from "react-router-dom";
import React from "react";
import Layout from "./Layout";

interface RouteError {
  statusText?: string;
  message?: string;
}
export default function ErrorPage() {
  const { statusText, message } = useRouteError() as RouteError;

  return (
    <Layout>
      <div id="error-page">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>{statusText || message}</i>
        </p>
      </div>
    </Layout>
  );
}
