const OnboardingScreen = require("../models/OnboardingScreen");
const { readSeedJson } = require("./utils");

async function runOnboardingSeeder() {
  const exists = await OnboardingScreen.findOne().lean();
  if (exists) return;

  const rows = readSeedJson("data", "onboardingScreens.json");

  for (const row of rows) {
    const { title, description } = row;
    const translation_dataset = JSON.stringify({
      en: { locale: "en", title, description },
    });
    await OnboardingScreen.create({ ...row, translation_dataset });
  }
}

module.exports = { runOnboardingSeeder };
