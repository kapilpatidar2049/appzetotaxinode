/**
 * Port of Helpers/Payment/PaymentReferenceHelper.php
 * Wallet / Firebase / push logic should live in controllers or services — use
 * generatePaymentReference from here; wire addMoneyToWallet to your Mongoose models.
 */

function generatePaymentReference(userId, requestFor) {
  const ts = Math.floor(Date.now() / 1000);
  return `${requestFor}--${ts}--${userId}`;
}

/**
 * Placeholder: implement with UserWallet / DriverWallet / OwnerWallet (Mongo).
 * @returns {Promise<{ ok: boolean }>}
 */
async function addMoneyToWallet() {
  throw new Error(
    "addMoneyToWallet: implement using Wallet models and WalletHistory (see PaymentReferenceHelper.php)"
  );
}

module.exports = {
  generatePaymentReference,
  addMoneyToWallet,
};
