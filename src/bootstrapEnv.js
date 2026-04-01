// Load .env before any other app config (CLI seeders, tests, etc.).
const path = require("path");
const dotenv = require("dotenv");

const backendEnvPath = path.join(__dirname, "..", ".env");
const rootEnvPath = path.join(__dirname, "..", "..", ".env");

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath, override: false });
