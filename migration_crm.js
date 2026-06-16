const fs = require("fs");
const path = require("path");

const customersPath = path.join(__dirname, "data", "customers.json");
const vehiclesPath = path.join(__dirname, "data", "vehicles.json");

if (fs.existsSync(customersPath)) {
  let customers = JSON.parse(fs.readFileSync(customersPath, "utf-8"));
  customers = customers.map(c => ({
    ...c,
    email: c.email || "",
    address: c.address || "",
    gst_number: c.gst_number || "",
    customer_type: c.customer_type || "Retail",
    tags: c.tags || [],
    notes: c.notes || ""
  }));
  fs.writeFileSync(customersPath, JSON.stringify(customers, null, 2));
  console.log("Migrated customers.json");
}

if (fs.existsSync(vehiclesPath)) {
  let vehicles = JSON.parse(fs.readFileSync(vehiclesPath, "utf-8"));
  vehicles = vehicles.map(v => ({
    ...v,
    insurance_expiry: v.insurance_expiry || null,
    pollution_expiry: v.pollution_expiry || null,
    chassis_number: v.chassis_number || "",
    engine_number: v.engine_number || "",
    color: v.color || ""
  }));
  fs.writeFileSync(vehiclesPath, JSON.stringify(vehicles, null, 2));
  console.log("Migrated vehicles.json");
}
