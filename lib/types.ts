export type JobStatus = "running" | "completed" | "delayed" | "pending";

export interface ServiceItem {
  name: string;
  description?: string;
  amount: number;
}

export interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  mobile: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleType: string;
  wheelType?: string | null;
  tyreType?: string | null;
  wheelSize?: string | null;
  status: JobStatus;
  time: string;
  date: string;
  technician: string;
  startTime: string;
  expectedEnd: string;
  actualEnd: string | null;
  delay: string | null;
  remarks: string;
  services: ServiceItem[];
  subTotal: number;
  gst: number;
  grandTotal: number;
}

export interface Metrics {
  totalJobs: number;
  running: number;
  completed: number;
  delayed: number;
  pending: number;
}

export interface Vehicle {
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: string;
  customerName: string;
  mobile: string;
  lastJobDate: string;
  lastJobId: string;
}

export type Technician = string;

export interface CreateJobPayload {
  customerName: string;
  mobile: string;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleType?: string;
  wheelType?: string;
  tyreType?: string;
  technician: string;
  services: ServiceItem[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}
