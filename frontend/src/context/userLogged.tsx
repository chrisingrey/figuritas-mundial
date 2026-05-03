import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type MeResponse } from "@backend";

interface UserLoggedState {
  user: MeResponse | null;
  loading: boolean;
  login: (user: MeResponse) => void;
  logout: () => void;
}

const UserLoggedContext = createContext<UserLoggedState | null>(null);

export function UserLoggedProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    authService.me()
      .then(setUser)
      .catch(() => authService.logout())
      .finally(() => setLoading(false));
  }, []);

  const login = (loggedUser: MeResponse) => setUser(loggedUser);

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <UserLoggedContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserLoggedContext.Provider>
  );
}

export function useUserLogged(): UserLoggedState {
  const ctx = useContext(UserLoggedContext);
  if (!ctx) throw new Error("useUserLogged must be used inside UserLoggedProvider");
  return ctx;
}
