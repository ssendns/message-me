import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import MainPage from "./pages/MainPage";
import EditPage from "./pages/EditPage";

export default function RouterWrapper() {
  const routes = [
    { path: "/", element: <MainPage /> },
    { path: "/sign-up", element: <SignUpPage /> },
    { path: "/log-in", element: <LogInPage /> },
    { path: "/edit", element: <EditPage /> },
    { path: "/chats/:chatId/edit", element: <EditPage /> },
  ];
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}
