/**
 * Helpers/Rides/*.php — Node barrel.
 * Implemented: rideDistanceAndDuration, noDriverFound (see services/noDriverFoundService.js).
 */

const rideDistanceAndDuration = require("./rideDistanceAndDuration");
const { noDriverFound } = require("../../../services/noDriverFoundService");

module.exports = {
  ...rideDistanceAndDuration,

  noDriverFound,

  /** @see Helpers/Rides/EndRequestHelper.php */
  endRequestHelper: async () => {
    throw new Error("endRequestHelper: port EndRequestHelper.php");
  },

  /** @see Helpers/Rides/RidePriceCalculationHelpers.php */
  ridePriceCalculation: async () => {
    throw new Error("ridePriceCalculation: port RidePriceCalculationHelpers.php");
  },

  /** @see Helpers/Rides/StoreEtaDetailForRideHelper.php */
  storeEtaDetailForRide: async () => {
    throw new Error("storeEtaDetailForRide: port StoreEtaDetailForRideHelper.php");
  },

  /** @see Helpers/Rides/PaymentOptionCalculationHelper.php */
  paymentOptionCalculation: async () => {
    throw new Error("paymentOptionCalculation: port PaymentOptionCalculationHelper.php");
  },

  /** @see Helpers/Rides/FetchDriversFromFirebaseHelpers.php */
  fetchDriversFromFirebase: async () => {
    throw new Error("fetchDriversFromFirebase: port FetchDriversFromFirebaseHelpers.php");
  },

  /** @see Helpers/Rides/CancellationFeeHelper.php */
  cancellationFee: async () => {
    throw new Error("cancellationFee: port CancellationFeeHelper.php");
  },

  /** @see Helpers/Rides/CancellationFeeDriverHelper.php */
  cancellationFeeDriver: async () => {
    throw new Error("cancellationFeeDriver: port CancellationFeeDriverHelper.php");
  },

  /** @see Helpers/Rides/CalculatAdminCommissionAndTaxHelper.php */
  calculateAdminCommissionAndTax: async () => {
    throw new Error(
      "calculateAdminCommissionAndTax: port CalculatAdminCommissionAndTaxHelper.php"
    );
  },
};
