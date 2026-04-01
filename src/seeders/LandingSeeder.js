/**
 * Laravel seeds many `landing_*` CMS tables (headers, home sections, etc.).
 * Those collections are not modeled in this Node project yet.
 * Regenerate from `phpseeders/LandingSiteSeeder.php` / `LandingHomeSeeder.php` after adding models, or run the PHP seeder against MySQL.
 */
async function runLandingSeeder() {
  const appFor = process.env.APP_FOR || "";
  console.log(
    `LandingSeeder: skipped (APP_FOR=${appFor || "unset"}). ` +
      "CMS landing tables from phpseeders are not migrated to Mongo here."
  );
}

module.exports = { runLandingSeeder };
