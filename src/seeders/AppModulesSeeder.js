const MobileAppSetting = require("../models/MobileAppSetting");

const app_modules = [
  {
    name: "Taxi",
    transport_type: "taxi",
    service_type: "normal",
    order_by: "1",
    short_description: "Normal Taxi",
    description: "Normal Taxi",
    mobile_menu_icon: "taxi.png",
    active: true,
  },
  {
    name: "Delivery",
    transport_type: "delivery",
    service_type: "normal",
    order_by: "2",
    short_description: "Normal Delivery",
    description: "Normal Delivery",
    mobile_menu_icon: "delivery.png",
    active: true,
  },
  {
    name: "Rental",
    transport_type: "taxi",
    service_type: "rental",
    order_by: "3",
    short_description: "Rental Taxi",
    description: "rental Taxi",
    mobile_menu_icon: "rental.png",
    active: true,
  },
  {
    name: "Delivery Rental",
    transport_type: "delivery",
    service_type: "rental",
    order_by: "4",
    short_description: "Rental Delivery",
    description: "Rental Delivery",
    mobile_menu_icon: "rental.png",
    active: true,
  },
  {
    name: "Outstation",
    transport_type: "taxi",
    service_type: "outstation",
    order_by: "5",
    short_description: "Outstation Taxi",
    description: "Outstation Taxi",
    mobile_menu_icon: "outstation.png",
    active: true,
  },
  {
    name: "Delivery Outstation",
    transport_type: "delivery",
    service_type: "outstation",
    order_by: "6",
    short_description: "Outstation Delivery",
    description: "Outstation Delivery",
    mobile_menu_icon: "outstation.png",
    active: true,
  },
];

async function runAppModulesSeeder() {
  const exists = await MobileAppSetting.findOne().lean();
  if (exists) return;

  await MobileAppSetting.insertMany(app_modules);
}

module.exports = { runAppModulesSeeder };
