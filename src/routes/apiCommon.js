const express = require("express");
const axios = require("axios");const config = require("../config");
const { getMapSetting } = require("../utils/settings");
const { authenticate } = require("../middleware/auth");
const { limit120PerMinute } = require("../middleware/rateLimit");
const Language = require("../models/Language");
const ServiceLocation = require("../models/ServiceLocation");

const apiCommonRoutes = express.Router();
apiCommonRoutes.use(limit120PerMinute);

// This router corresponds to Laravel routes/api/v1/api.php
// It is mounted at /api/v1/ in apiV1.js

async function buildTranslationPayloadFromSheets(sheetIdFromDb) {
  const apiKey = await getMapSetting("google_map_key_for_distance_matrix");
  if (!apiKey) {
    const error = new Error("google_map_key_for_distance_matrix not configured");
    error.status = 500;
    throw error;
  }

  const sheetId = sheetIdFromDb;
  const ranges = ["Settings!A:Z", "Sheet1!A:Z", "Update-Config!A:Z"];
  const rangeQuery = ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    sheetId
  )}/values:batchGet?${rangeQuery}&key=${encodeURIComponent(apiKey)}`;

  const response = await axios.get(url);
  const data = response.data;

  const settings = {};
  const language = {};
  const lang = {};
  let updateSheet = false;

  const settingsRows = data?.valueRanges?.[0]?.values || [];
  const translationRows = data?.valueRanges?.[1]?.values || [];
  const updateConfigRows = data?.valueRanges?.[2]?.values || [];

  for (let i = 1; i < settingsRows.length; i++) {
    const sett = settingsRows[i];

    if (updateConfigRows?.[1]?.[1] === "TRUE") {
      updateSheet = true;
    }

    if (sett[0] !== "") {
      settings[sett[0]] = settings[sett[0]] || {};
      settings[sett[0]][sett[1]] =
        Object.prototype.hasOwnProperty.call(sett, 2) && sett[2] !== undefined
          ? sett[2]
          : "TRUE";
    }
  }

  translationRows.forEach((row, rowIndex) => {
    for (let i = 1; i < row.length; i++) {
      if (rowIndex === 0) {
        if (row[i] !== "") {
          const key = row[i];
          const showSetting =
            settings[key] && Object.prototype.hasOwnProperty.call(settings[key], "show")
              ? settings[key].show
              : "TRUE";
          lang[i] = {
            name: key,
            state: showSetting === "TRUE",
          };
        }
      } else {
        if (row[0] !== "" && lang[i] && lang[i].state) {
          const languageName = lang[i].name;
          const translationKey = row[0];
          language[languageName] = language[languageName] || {};
          language[languageName][translationKey] = row[i];
        }
      }
    }
  });

  return { updateSheet, language };
}

// Translation routes
apiCommonRoutes.get("/translation/get", async (req, res, next) => {
  try {
    const sheetId = await getMapSetting("google_sheet_id");
    if (!sheetId) {
      return res.status(500).json({
        success: false,
        message: "google_sheet_id not configured",
      });
    }

    const { updateSheet, language } = await buildTranslationPayloadFromSheets(
      sheetId
    );

    res.json({
      success: true,
      update_sheet: updateSheet,
      data: language,
    });
  } catch (err) {
    next(err);
  }
});

apiCommonRoutes.get("/translation-user/get", async (req, res, next) => {
  try {
    const { updateSheet, language } = await buildTranslationPayloadFromSheets(
      "1R5FZvcrzX9zvu6E-_dOEXgFTEhbRIiHwrBXRiFpQPUU"
    );

    res.json({
      success: true,
      update_sheet: updateSheet,
      data: language,
    });
  } catch (err) {
    next(err);
  }
});

apiCommonRoutes.get("/translation/list", async (req, res, next) => {
  try {
    let rows;
    
      const languages = await Language.find({ active: true })
        .sort({ order: 1, name: 1 })
        .select({ code: 1, direction: 1, active: 1, name: 1, is_default: 1 });

      rows = languages.map((lang) => ({
        code: lang.code,
        direction: lang.direction,
        active: lang.active ? 1 : 0,
        name: lang.name,
        default_status: lang.is_default ? 1 : 0,
      }));
    

    res.json({
      success: true,
      message: "success",
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

// ServiceLocation (auth middleware in Laravel is handled elsewhere)
apiCommonRoutes.get("/servicelocation", authenticate, async (req, res, next) => {
  try {
    let rows;
    
      const serviceLocations = await ServiceLocation.find({ active: true }).select({
        name: 1,
        currency_code: 1,
        timezone: 1,
        active: 1,
      });

      rows = serviceLocations.map((location) => ({
        id: location._id,
        name: location.name,
        currency_name: location.currency_code || null,
        currency_symbol: null,
        currency_code: location.currency_code || null,
        timezone: location.timezone || null,
        active: location.active ? 1 : 0,
      }));
    

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = apiCommonRoutes;

