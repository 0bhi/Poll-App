const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create HTTP server for Next.js only
const server = createServer(async (req, res) => {
  try {
    // Health check endpoint (before Next.js handler)
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "nextjs" }));
      return;
    }

    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error occurred handling", req.url, err);
    res.statusCode = 500;
    res.end("internal server error");
  }
});

// Start the server
app.prepare().then(() => {
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js server ready on http://${hostname}:${port}`);
    if (dev) {
      console.log(
        `> Socket.IO server should be running separately on port ${
          process.env.SOCKET_PORT || 3001
        }`
      );
    }
  });
});

// Error handling
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
