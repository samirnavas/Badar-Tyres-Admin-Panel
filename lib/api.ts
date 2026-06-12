import type {
  CreateJobPayload,
  Job,
  JobStatus,
  Metrics,
  Technician,
  Vehicle,
  User,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore body parse errors */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMetrics: () => request<Metrics>("/metrics"),

  getJobs: (params?: { status?: JobStatus | "all"; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<Job[]>(`/jobs${qs ? `?${qs}` : ""}`);
  },

  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  getTechnicians: () => request<Technician[]>("/technicians"),

  getManufacturers: () => request<Record<string, string[]>>("/manufacturers"),

  getServices: () => request<string[]>("/services"),

  getVehicles: () => request<Vehicle[]>("/vehicles"),

  createJob: (payload: CreateJobPayload) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteJob: (id: string) =>
    request<Job>(`/jobs/${id}`, {
      method: "DELETE",
    }),

  getUsers: () => request<User[]>("/users"),

  updateUserRole: (id: string, role: string) =>
    request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request<User>(`/users/${id}`, {
      method: "DELETE",
    }),
};
