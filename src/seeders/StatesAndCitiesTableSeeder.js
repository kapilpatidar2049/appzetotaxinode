const State = require("../models/State");
const City = require("../models/City");
const { readSeedJson } = require("./utils");

async function runStatesAndCitiesTableSeeder() {
  if (process.env.FORCE_STATES_RESEED !== "1" && (await City.estimatedDocumentCount()) > 0) {
    return;
  }

  const { statesWithCities, cityAliases } = readSeedJson("data", "statesCities.json");

  let order =
    (await City.findOne()
      .sort({ display_order: -1 })
      .select({ display_order: 1 })
      .lean())?.display_order || 0;

  for (const [stateName, cities] of Object.entries(statesWithCities)) {
    let state = await State.findOne({ name: stateName });
    if (!state) {
      state = await State.create({ name: stateName });
    }

    for (const cityName of cities) {
      const found = await City.findOne({ state_id: state._id, name: cityName });
      if (found) continue;
      order += 1;
      const alias = cityAliases[cityName] || undefined;
      await City.create({
        name: cityName,
        state_id: state._id,
        display_order: order,
        ...(alias ? { alias } : {}),
      });
    }
  }
}

module.exports = { runStatesAndCitiesTableSeeder };
