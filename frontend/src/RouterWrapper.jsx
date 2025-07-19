import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import ChatPage from "./pages/ChatPage";
import EditAccountPage from "./pages/EditAccountPage";

export default function RouterWrapper() {
  const routes = [
    { path: "/", element: <ChatPage /> },
    { path: "/sign-up", element: <SignUpPage /> },
    { path: "/log-in", element: <LogInPage /> },
    { path: "/edit", element: <EditAccountPage /> },
  ];
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}
