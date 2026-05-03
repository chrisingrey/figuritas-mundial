import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type MeResponse } from "@backend";

type AlbumPermission = { id: string; name: string; code: string };

interface UserLoggedState {
  user: MeResponse | null;
  loading: boolean;
  getAlbumPermissions: (albumId: string) => AlbumPermission[];
  setAlbumPermissions: (albumId: string, permissions: AlbumPermission[]) => void;
  login: (user: MeResponse) => void;
  logout: () => void;
}

const UserLoggedContext = createContext<UserLoggedState | null>(null);

export function UserLoggedProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [albumPermissions, setAlbumPermissionsState] = useState<Record<string, AlbumPermission[]>>({});
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

  const getAlbumPermissions = useCallback(
    (albumId: string) => albumPermissions[albumId] ?? [],
    [albumPermissions],
  );

  const setAlbumPermissions = useCallback((albumId: string, permissions: AlbumPermission[]) => {
    setAlbumPermissionsState(prev => ({ ...prev, [albumId]: permissions }));
  }, []);

  const logout = () => {
    authService.logout();
    setUser(null);
    setAlbumPermissionsState({});
  };

  return (
    <UserLoggedContext.Provider value={{ user, loading, getAlbumPermissions, setAlbumPermissions, login, logout }}>
      {children}
    </UserLoggedContext.Provider>
  );
}

export function useUserLogged(): UserLoggedState {
  const ctx = useContext(UserLoggedContext);
  if (!ctx) throw new Error("useUserLogged must be used inside UserLoggedProvider");
  return ctx;
}
