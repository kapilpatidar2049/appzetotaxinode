require("./bootstrapEnv");

const cluster = require("cluster");
const os = require("os");
const http = require("http");
const config = require("./config");

/**
 * One Node process uses ~1 CPU core. Set WEB_CONCURRENCY to vCPU count on KVM / t3.xlarge
 * (e.g. 4). Each worker opens its own DB pool — size pools (MONGO_MAX_POOL_SIZE, MYSQL_POOL_LIMIT)
 * so total connections stay under DB limits.
 */
const webConcurrency = Math.max(
  1,
  parseInt(process.env.WEB_CONCURRENCY || "1", 10) || 1
);

function tuneServer(server) {
  // ALB / reverse proxies often use 60s idle; avoid premature socket drops.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

async function startWorker() {
  const app = require("./app");
  const { connectMongo } = require("./config/mongo");

  await connectMongo();

  const server = http.createServer(app);

  tuneServer(server);

  await new Promise((resolve, reject) => {
    server.listen(config.port, () => resolve());
    server.on("error", reject);
  });

  console.log(
    `Listening on port ${config.port} (pid ${process.pid}${cluster.isWorker ? ", worker" : ""})`
  );
}

async function main() {
  try {
    await startWorker();
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

if (webConcurrency > 1 && cluster.isPrimary) {
  const n = Math.min(webConcurrency, os.cpus().length);
  console.log(`Primary ${process.pid} starting ${n} workers (WEB_CONCURRENCY=${webConcurrency})`);
  for (let i = 0; i < n; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} exited (${signal || code}); replacing`);
    cluster.fork();
  });
} else {
  main();
}
