/**
 * Laravel get_user_locations / get_user_location_ids — role-based service locations.
 * Implement when User/Admin/Owner role relations match your Mongo schema.
 */

async function getUserLocations() {
  return [];
}

async function getUserLocationIds() {
  return [];
}

module.exports = {
  getUserLocations,
  getUserLocationIds,
};
