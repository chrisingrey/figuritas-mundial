import { useState } from "react";
import axios from "axios";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";
import { authService } from "@backend";
import {
  registerWithEmailAndPassword,
  signInWithEmailAndPasswordToken,
  signInWithGoogle,
} from "@/firebase";
import { useUserLogged } from "@/context";
import styles from "./index.module.scss";

type Mode = "login" | "register";

function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 500) {
    return "La API tuvo un error interno. Revisá los logs de Vercel del backend.";
  }

  if (typeof data === "object" && data && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  if (typeof data === "string") {
    return status
      ? `La API respondió ${status}. Revisá los logs del backend.`
      : "No se pudo conectar con la API.";
  }

  if (!error.response) {
    return "No se pudo conectar con la API. Revisá VITE_API_URL y CORS.";
  }

  return status ? `La API respondió ${status}.` : "No se pudo completar la solicitud.";
}

function getAuthErrorMessage(error: unknown, mode: Mode): string {
  const apiMessage = getApiErrorMessage(error);
  if (apiMessage) return apiMessage;

  if (error instanceof FirebaseError) {
    if (error.code === "auth/configuration-not-found") {
      return "Firebase Auth no esta activado o la API key no pertenece a este proyecto.";
    }

    if (error.code === "auth/popup-closed-by-user") {
      return "Se cerro la ventana de Google antes de completar el inicio de sesion.";
    }

    if (error.code === "auth/unauthorized-domain") {
      return "Este dominio no esta autorizado en Firebase Authentication.";
    }

    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      return "Email o contraseña incorrectos.";
    }

    if (error.code === "auth/email-already-in-use") {
      return "Ya existe una cuenta con este email.";
    }
  }

  return mode === "login"
    ? "Email o contraseña incorrectos."
    : "No se pudo crear la cuenta. El email puede estar en uso.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useUserLogged();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const idToken = await signInWithEmailAndPasswordToken(email, password);
        const res = await authService.loginWithFirebaseToken(idToken);
        if (res.requires2FA) {
          setError("Este usuario tiene 2FA activado. Usá la app móvil para continuar.");
          return;
        }
      } else {
        const idToken = await registerWithEmailAndPassword(email, password, fullname);
        const res = await authService.loginWithFirebaseToken(idToken);
        if (res.requires2FA) {
          setError("Este usuario tiene 2FA activado. Usá la app móvil para continuar.");
          return;
        }
      }
      const me = await authService.me();
      login(me);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await authService.loginWithGoogle(idToken);
      if (res.requires2FA) {
        setError("Este usuario tiene 2FA activado. Usá la app móvil para continuar.");
        return;
      }
      const me = await authService.me();
      login(me);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err, "login"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.albumPreview} aria-hidden="true">
        <div className={styles.albumCover}>
          <span>OFFICIAL STICKER COLLECTION</span>
          <strong>26</strong>
          <em>FIFA</em>
          <b>WORLD CUP 2026</b>
        </div>
        <div className={styles.packStack}>
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.brand}>
          <p>Official Sticker Collection</p>
          <h1>Figuritas</h1>
          <span>Mundial 2026</span>
        </div>

        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          <GoogleIcon />
          {googleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <div className={styles.divider}>
          <span>o</span>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={mode === "register" ? styles.tabActive : styles.tab}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "register" && (
            <div className={styles.field}>
              <label htmlFor="fullname">Nombre completo</label>
              <input
                id="fullname"
                type="text"
                value={fullname}
                onChange={e => setFullname(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading || googleLoading}>
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
