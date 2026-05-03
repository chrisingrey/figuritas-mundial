import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { UserLoggedProvider, useUserLogged } from "@/context";
import Auth from "@/layouts/Auth";
import Home from "@/layouts/Home";
import Album from "@/layouts/Album";
import AcceptInvitation from "@/layouts/AcceptInvitation";
import type { ReactNode } from "react";

const REDIRECT_KEY = "fwc_redirect";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useUserLogged();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#667085" }}>Cargando...</div>;
  if (!user) {
    const intended = window.location.pathname + window.location.search;
    if (intended !== "/" && intended !== "/login") {
      sessionStorage.setItem(REDIRECT_KEY, intended);
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function consumeRedirect(): string {
  const url = sessionStorage.getItem(REDIRECT_KEY) ?? "/";
  sessionStorage.removeItem(REDIRECT_KEY);
  return url;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useUserLogged();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Auth />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/album/:albumId"
        element={
          <ProtectedRoute>
            <Album />
          </ProtectedRoute>
        }
      />
      <Route
        path="/albums/:albumId/invitations/:invitationId"
        element={
          <ProtectedRoute>
            <AcceptInvitation />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserLoggedProvider>
        <AppRoutes />
      </UserLoggedProvider>
    </BrowserRouter>
  );
}
