const mongoose = require("mongoose");
const config = require("./index");

async function connectMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, {
    maxPoolSize: config.mongoMaxPoolSize,
    minPoolSize: config.mongoMinPoolSize,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log("MongoDB connected");
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = {
  connectMongo,
  disconnectMongo,
};

