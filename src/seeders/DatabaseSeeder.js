/**
 * Mirrors `phpseeders/DatabaseSeeder.php` order, plus Node-only document seeders.
 *
 * Re-run heavy seeders after updating JSON from PHP:
 *   npm run seed:extract-php
 * Unix: FORCE_STATES_RESEED=1 FORCE_CAR_RESEED=1 npm run seeders
 * PowerShell: $env:FORCE_STATES_RESEED='1'; $env:FORCE_CAR_RESEED='1'; npm run seeders
 */
require("../bootstrapEnv");

const mongoose = require("mongoose");
const config = require("../config");
const { connectMongo, disconnectMongo } = require("../config/mongo");

const { runRolesAndPermissionsSeeder } = require("./RolesAndPermissionsSeeder");
const { runCountriesTableSeeder } = require("./CountriesTableSeeder");
const { runTimeZoneSeeder } = require("./TimeZoneSeeder");
const { runDefaultLanguageSeeder } = require("./DefaultLanguageSeeder");
const { runAdminSeeder } = require("./AdminSeeder");
const { runSettingsSeeder } = require("./SettingsSeeder");
const { runCancellationReasonSeeder } = require("./CancellationReasonSeeder");
const { runGoodsTypeSeeder } = require("./GoodsTypeSeeder");
const { runMailTemplateSeeder } = require("./MailTemplateSeeder");
const { runThirdPartySettingSeeder } = require("./ThirdPartySettingSeeder");
const { runOnboardingSeeder } = require("./OnboardingSeeder");
const { runNotificationChannelSeeder } = require("./NotificationChannelSeeder");
const { runAppModulesSeeder } = require("./AppModulesSeeder");
const { runReferralConditionSeeder } = require("./ReferralConditionSeeder");
const { runLandingSeeder } = require("./LandingSeeder");
const { runDriverNeededDocumentSeeder } = require("./DriverNeededDocumentSeeder");
const { runOwnerNeededDocumentSeeder } = require("./OwnerNeededDocumentSeeder");
const { runFleetNeededDocumentSeeder } = require("./FleetNeededDocumentSeeder");
const { runStatesAndCitiesTableSeeder } = require("./StatesAndCitiesTableSeeder");
const { runCarMakeAndModelSeeder } = require("./CarMakeAndModelSeeder");

async function runDatabaseSeeder() {

  await connectMongo();

  // Order aligned with phpseeders/DatabaseSeeder.php, then extra Node seeders.
  await runRolesAndPermissionsSeeder();
  await runCountriesTableSeeder();
  await runTimeZoneSeeder();
  await runDefaultLanguageSeeder();
  await runAdminSeeder();
  await runSettingsSeeder();
  await runCancellationReasonSeeder();
  await runGoodsTypeSeeder();
  await runMailTemplateSeeder();
  await runThirdPartySettingSeeder();
  await runOnboardingSeeder();
  await runNotificationChannelSeeder();
  await runAppModulesSeeder();
  await runReferralConditionSeeder();
  await runLandingSeeder();

  await runDriverNeededDocumentSeeder();
  await runOwnerNeededDocumentSeeder();
  await runFleetNeededDocumentSeeder();
  await runStatesAndCitiesTableSeeder();
  await runCarMakeAndModelSeeder();

  console.log("DatabaseSeeder completed.");
  await disconnectMongo();
  await mongoose.connection.close();
}

runDatabaseSeeder().catch(async (error) => {
  console.error("DatabaseSeeder failed:", error);
  try {
    await disconnectMongo();
    await mongoose.connection.close();
  } catch {
    // ignore cleanup failure
  }
  process.exit(1);
});
