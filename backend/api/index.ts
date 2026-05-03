import app, { bootstrapApp } from "./app";

// ── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);

(async () => {
  await bootstrapApp();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Figuritas Mundial API running on http://localhost:${PORT}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error("❌ Server error:", error);
    }
    process.exit(1);
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    server.close(() => {
      console.log("👋 Server stopped.");
      process.exit(0);
    });
  });
})().catch((error: unknown) => {
  console.error("❌ Application bootstrap failed:", error);
  process.exit(1);
});
