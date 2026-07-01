import type { User } from "./models/User";
import type { Customer } from "./models/Customer";
import type { Vehicle } from "./models/Vehicle";
import type { Service } from "./models/Service";
import type { JobCard } from "./models/JobCard";
import type { ShopSettings } from "./models/ShopSettings";

/**
 * In-memory mock database for the Admin Panel.
 *
 * All IDs are UUID-style strings to mimic records coming from a real
 * relational database. Relationships are wired by ID so the data behaves
 * like foreign-keyed rows (e.g. a JobCard points at a real Customer,
 * Vehicle, technician and the User who created it).
 *
 * This is a stand-in only — swap these arrays for real DB queries later
 * without changing the consuming code or the model interfaces.
 */

export const mockUsers: User[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Badar Admin",
    role: "Admin",
    email: "admin@badartyres.com",
    phone: "+91 98400 11111",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Priya Menon",
    role: "Sales",
    email: "priya.menon@badartyres.com",
    phone: "+91 98400 22222",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Rahul Nair",
    role: "Technician",
    email: "rahul.nair@badartyres.com",
    phone: "+91 98400 33333",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Suresh Kumar",
    role: "Technician",
    email: "suresh.kumar@badartyres.com",
    phone: "+91 98400 44444",
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "c1a11111-0000-4000-8000-000000000001",
    name: "Arjun Pillai",
    phone: "+91 99001 10001",
    email: "arjun.pillai@example.com",
    address: "14/B Marine Drive, Kochi, Kerala 682031",
    created_at: "2026-01-12T09:15:00.000Z",
  },
  {
    id: "c1a11111-0000-4000-8000-000000000002",
    name: "Fatima Sheikh",
    phone: "+91 99001 10002",
    email: "fatima.sheikh@example.com",
    address: "27 MG Road, Bengaluru, Karnataka 560001",
    created_at: "2026-02-03T11:40:00.000Z",
  },
  {
    id: "c1a11111-0000-4000-8000-000000000003",
    name: "Vikram Reddy",
    phone: "+91 99001 10003",
    email: "vikram.reddy@example.com",
    address: "9 Jubilee Hills, Hyderabad, Telangana 500033",
    created_at: "2026-03-21T16:05:00.000Z",
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: "ed111111-0000-4000-8000-000000000001",
    customer_id: "c1a11111-0000-4000-8000-000000000001",
    type: "Car",
    manufacturer: "Toyota",
    model: "Innova Crysta",
    registration_number: "KL-07-AB-1234",
    next_service_date: "2026-09-15",
    created_at: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "ed111111-0000-4000-8000-000000000002",
    customer_id: "c1a11111-0000-4000-8000-000000000001",
    type: "Bike",
    manufacturer: "Royal Enfield",
    model: "Classic 350",
    registration_number: "KL-07-CD-5678",
    next_service_date: "2026-08-01",
    created_at: "2026-02-10T11:30:00.000Z",
  },
  {
    id: "ed111111-0000-4000-8000-000000000003",
    customer_id: "c1a11111-0000-4000-8000-000000000002",
    type: "Car",
    manufacturer: "Hyundai",
    model: "Creta",
    registration_number: "KA-01-EF-9012",
    next_service_date: "2026-10-20",
    created_at: "2026-03-05T09:45:00.000Z",
  },
  {
    id: "ed111111-0000-4000-8000-000000000004",
    customer_id: "c1a11111-0000-4000-8000-000000000003",
    type: "Others",
    manufacturer: "Mahindra",
    model: "Bolero Pik-Up",
    registration_number: "TS-09-GH-3456",
    next_service_date: "2026-07-30",
    created_at: "2026-04-18T14:20:00.000Z",
  },
];

export const mockServices: Service[] = [
  {
    id: "5e111111-0000-4000-8000-000000000001",
    category: "Wheel Care",
    name: "Wheel Alignment",
    price: 600,
    gst_rate: 18,
    in_stock: true,
  },
  {
    id: "5e111111-0000-4000-8000-000000000002",
    category: "Wheel Care",
    name: "Wheel Balancing",
    price: 400,
    gst_rate: 18,
    in_stock: true,
  },
  {
    id: "5e111111-0000-4000-8000-000000000003",
    category: "Tyre Service",
    name: "Tyre Fitting",
    price: 250,
    gst_rate: 18,
    in_stock: true,
  },
  {
    id: "5e111111-0000-4000-8000-000000000004",
    category: "Tyre Service",
    name: "Puncher Work",
    price: 150,
    gst_rate: 18,
    in_stock: true,
  },
  {
    id: "5e111111-0000-4000-8000-000000000005",
    category: "Air & Gas",
    name: "Nitrogen Air Fitting",
    price: 200,
    gst_rate: 18,
    in_stock: true,
  },
  {
    id: "5e111111-0000-4000-8000-000000000006",
    category: "Air & Gas",
    name: "A/C Gas Services",
    price: 1200,
    gst_rate: 28,
    in_stock: false,
  },
];

export const mockJobCards: JobCard[] = [
  {
    id: "30b11111-0000-4000-8000-000000000001",
    customer_id: "c1a11111-0000-4000-8000-000000000001",
    vehicle_id: "ed111111-0000-4000-8000-000000000001",
    assigned_technician_id: "33333333-3333-4333-8333-333333333333",
    technicianId: "33333333-3333-4333-8333-333333333333",
    bayId: null,
    status: "Completed",
    line_items: [
      {
        serviceId: "5e111111-0000-4000-8000-000000000001",
        name: "Wheel Alignment",
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
      {
        serviceId: "5e111111-0000-4000-8000-000000000002",
        name: "Wheel Balancing",
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
    ],
    service_item_ids: [
      "5e111111-0000-4000-8000-000000000001",
      "5e111111-0000-4000-8000-000000000002",
    ],
    subtotal: 1000,
    total_tax: 180,
    total_amount: 1180,
    warranty_end_date: "2026-12-01",
    warranty_notes: "6 months on wheel alignment & balancing",
    created_by: "11111111-1111-4111-8111-111111111111",
    created_at: "2026-06-01T08:30:00.000Z",
    updated_at: "2026-06-01T12:45:00.000Z",
  },
  {
    id: "30b11111-0000-4000-8000-000000000002",
    customer_id: "c1a11111-0000-4000-8000-000000000002",
    vehicle_id: "ed111111-0000-4000-8000-000000000003",
    assigned_technician_id: "44444444-4444-4444-8444-444444444444",
    technicianId: "44444444-4444-4444-8444-444444444444",
    bayId: "bay_2",
    status: "In Progress",
    line_items: [
      {
        serviceId: "5e111111-0000-4000-8000-000000000003",
        name: "Tyre Rotation",
        quantity: 1,
        unitPrice: 200,
        total: 200,
      },
      {
        serviceId: "5e111111-0000-4000-8000-000000000004",
        name: "Oil Change",
        quantity: 1,
        unitPrice: 200,
        total: 200,
      },
    ],
    service_item_ids: [
      "5e111111-0000-4000-8000-000000000003",
      "5e111111-0000-4000-8000-000000000004",
    ],
    subtotal: 400,
    total_tax: 72,
    total_amount: 472,
    warranty_end_date: null,
    warranty_notes: null,
    created_by: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-06-10T10:00:00.000Z",
    updated_at: "2026-06-10T10:15:00.000Z",
  },
  {
    id: "30b11111-0000-4000-8000-000000000003",
    customer_id: "c1a11111-0000-4000-8000-000000000003",
    vehicle_id: "ed111111-0000-4000-8000-000000000004",
    assigned_technician_id: "33333333-3333-4333-8333-333333333333",
    technicianId: "33333333-3333-4333-8333-333333333333",
    bayId: null,
    status: "Estimate",
    line_items: [
      {
        serviceId: "5e111111-0000-4000-8000-000000000005",
        name: "Nitrogen Air Filling",
        quantity: 1,
        unitPrice: 200,
        total: 200,
      },
    ],
    service_item_ids: ["5e111111-0000-4000-8000-000000000005"],
    subtotal: 200,
    total_tax: 36,
    total_amount: 236,
    warranty_end_date: "2027-06-14",
    warranty_notes: "1 year on nitrogen air fitting valves",
    created_by: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-06-14T14:20:00.000Z",
    updated_at: "2026-06-14T14:20:00.000Z",
  },
];

export const mockShopSettings: ShopSettings = {
  shop_name: "Badar Tyres & Auto Care",
  shop_address: "Wayanad Road, Koduvally, Kozhikode",
  contact_phone: "+919188954101",
  contact_email: "info@badartyres.com",
  default_gst_rate: 18,
  terms_and_conditions:
    "1. All services carry a warranty as noted on the job card.\n2. Goods once sold are not returnable.\n3. Payment is due on completion of work.\n4. Vehicles left beyond 7 days of completion may incur storage charges.",
};
