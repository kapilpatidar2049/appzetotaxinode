const mongoose = require("mongoose");

const MailTemplateSchema = new mongoose.Schema(
  {
    mail_type: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true },
    description: { type: String, default: "" },
    translation_dataset: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MailTemplate || mongoose.model("MailTemplate", MailTemplateSchema);
