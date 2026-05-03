import cors from "cors";

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

export const corsHandler = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
  credentials: true,
});
