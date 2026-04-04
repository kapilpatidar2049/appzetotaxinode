const mongoose = require("mongoose");
const crypto = require("crypto");

const TranslationWordSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true, trim: true },
    email_subject: { type: String, default: "" },
    mail_body: { type: String, default: "" },
    button_name: { type: String, default: "" },
    footer_content: { type: String, default: "" },
    footer_copyrights: { type: String, default: "" },
    push_title: { type: String, default: "" },
    push_body: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

/**
 * Laravel-style notification channel templates (email/push copy per topic).
 * Distinct from the legacy `NotificationChannel` model (slug push/email/sms).
 */
const NotificationChannelTemplateSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomUUID(),
    },
    role: { type: String, default: "user", index: true },
    topics: { type: String, default: "" },
    topics_content: { type: String, default: "" },
    push_notification: { type: Number, default: 1 },
    mail: { type: Number, default: 0 },
    sms: { type: Number, default: 0 },
    email_subject: { type: String, default: "" },
    logo_img: { type: String, default: "" },
    mail_body: { type: String, default: "" },
    button_name: { type: String, default: "" },
    button_url: { type: String, default: "" },
    show_button: { type: Number, default: 0 },
    banner_img: { type: String, default: "" },
    show_img: { type: Number, default: 0 },
    footer: { type: String, default: "" },
    footer_content: { type: String, default: "" },
    footer_copyrights: { type: String, default: "" },
    show_fbicon: { type: Number, default: 1 },
    show_instaicon: { type: Number, default: 1 },
    show_twittericon: { type: Number, default: 1 },
    show_linkedinicon: { type: Number, default: 1 },
    push_title: { type: String, default: "" },
    push_body: { type: String, default: "" },
    translation_dataset: { type: String, default: "" },
    translations: [TranslationWordSchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NotificationChannelTemplate ||
  mongoose.model("NotificationChannelTemplate", NotificationChannelTemplateSchema);
