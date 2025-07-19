import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";

export default function RouterWrapper() {
  const routes = [
    { path: "/", element: <App /> },
    { path: "/sign-up", element: <SignUpPage /> },
    { path: "/log-in", element: <LogInPage /> },
  ];
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}
