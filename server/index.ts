import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { spawn } from "child_process";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Generate Shakespeare works data from XML files
const parserProcess = spawn("python", ["server/shakespeare-parser.py"], {
  stdio: "inherit"
});

parserProcess.on("error", (err) => {
  console.error("Failed to run Shakespeare parser:", err);
});

parserProcess.on("exit", (code) => {
  if (code !== 0) {
    console.error("Shakespeare parser exited with code:", code);
  }
});

// Start the Python lexicon service
const pythonProcess = spawn("python", ["server/shakespeare-lexicon.py"], {
  stdio: "inherit"
});

pythonProcess.on("error", (err) => {
  console.error("Failed to start Python lexicon service:", err);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Cleanup on server shutdown
  process.on("exit", () => {
    pythonProcess.kill();
    parserProcess.kill();
  });

  process.on("SIGTERM", () => {
    pythonProcess.kill();
    parserProcess.kill();
    process.exit(0);
  });
})();