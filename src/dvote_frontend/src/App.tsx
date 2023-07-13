import React from "react";
import Vote from "./Vote";
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "./ErrorPage";
import Header from "./Header";
import Explore from "./Explore";
import Mine from "./Mine";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Explore />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/mine",
    element: <Mine />,
  },
  {
    path: "/vote/:hash",
    element: <Vote />,
  },
]);

export default function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Header />
      </BrowserRouter>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
