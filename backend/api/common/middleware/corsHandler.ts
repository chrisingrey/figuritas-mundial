import cors from "cors";

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174,http://localhost:5175")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOriginPatterns = (process.env.CORS_ORIGIN_PATTERNS ?? "")
  .split(",")
  .map((pattern) => pattern.trim())
  .filter(Boolean)
  .map((pattern) => new RegExp(pattern));

function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.includes(origin) ||
    allowedOriginPatterns.some((pattern) => pattern.test(origin));
}

export const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
  credentials: true,
  maxAge: 0,
});
