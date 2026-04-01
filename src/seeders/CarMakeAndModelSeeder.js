const CarMake = require("../models/CarMake");
const CarModel = require("../models/CarModel");
const { readSeedJson } = require("./utils");

function transportFor(vehicle_make_for) {
  if (vehicle_make_for === "truck") return "delivery";
  if (vehicle_make_for === "motor_bike") return "both";
  return "taxi";
}

async function runCarMakeAndModelSeeder() {
  if (process.env.FORCE_CAR_RESEED !== "1" && (await CarModel.estimatedDocumentCount()) > 0) {
    return;
  }

  const data = readSeedJson("data", "carMakeModel.json");

  for (const [vehicle_make_for, makes] of Object.entries(data)) {
    const transport_type = transportFor(vehicle_make_for);
    for (const [makeName, models] of Object.entries(makes)) {
      let makeDoc = await CarMake.findOne({ name: makeName });
      if (!makeDoc) {
        makeDoc = await CarMake.create({
          name: makeName,
          vehicle_make_for,
          transport_type,
        });
      }
      for (const modelName of models) {
        await CarModel.updateOne(
          { make_id: makeDoc._id, name: modelName },
          { $setOnInsert: { make_id: makeDoc._id, name: modelName } },
          { upsert: true }
        );
      }
    }
  }
}

module.exports = { runCarMakeAndModelSeeder };
