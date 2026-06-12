"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import type { CreateJobPayload, JobStatus } from "./types";

export const queryKeys = {
  metrics: ["metrics"] as const,
  jobs: (filters?: { status?: JobStatus | "all"; search?: string }) =>
    ["jobs", filters ?? {}] as const,
  technicians: ["technicians"] as const,
  manufacturers: ["manufacturers"] as const,
  services: ["services"] as const,
  vehicles: ["vehicles"] as const,
  users: ["users"] as const,
};

export function useMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics,
    queryFn: api.getMetrics,
  });
}

export function useJobs(filters?: {
  status?: JobStatus | "all";
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.jobs(filters),
    queryFn: () => api.getJobs(filters),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: queryKeys.technicians,
    queryFn: api.getTechnicians,
  });
}

export function useManufacturers() {
  return useQuery({
    queryKey: queryKeys.manufacturers,
    queryFn: api.getManufacturers,
  });
}

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: api.getServices,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: api.getVehicles,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJobPayload) => api.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: api.getUsers,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}
