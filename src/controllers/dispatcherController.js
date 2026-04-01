const requestController = require("./requestController");

// Dispatcher endpoints in Laravel reuse EtaController methods.
// We proxy to requestController implementations for parity at route level.

async function requestEta(req, res) {
  return requestController.eta(req, res);
}

async function requestListPackages(req, res) {
  return requestController.listPackages(req, res);
}

module.exports = {
  requestEta,
  requestListPackages,
};

