"use server";

import type {
  InspectionReport,
  InspectionReportInput,
} from "../models/Inspection";
import { assertNoError, firstOrNull } from "../database/helpers";
import {
  inspectionFromRow,
  inspectionToRow,
  type InspectionRow,
} from "../database/mappers";
import { generateId } from "../generateId";
import { supabase } from "../supabase";
import { simulateLatency } from "./delay";

class InspectionRepository {
  async getInspections(): Promise<InspectionReport[]> {
    await simulateLatency();
    const result = await supabase.from("inspections").select("*").order("created_at", { ascending: false });
    const rows = assertNoError(result, "getInspections") as InspectionRow[];
    return (rows ?? []).map(inspectionFromRow);
  }

  async getInspectionById(id: string): Promise<InspectionReport | null> {
    await simulateLatency();
    const result = await supabase.from("inspections").select("*").eq("id", id).limit(1);
    const row = firstOrNull(assertNoError(result, "getInspectionById") as InspectionRow[]);
    return row ? inspectionFromRow(row) : null;
  }

  async getInspectionsByJobId(jobId: string): Promise<InspectionReport[]> {
    await simulateLatency();
    const result = await supabase
      .from("inspections")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    const rows = assertNoError(result, "getInspectionsByJobId") as InspectionRow[];
    return (rows ?? []).map(inspectionFromRow);
  }

  async createInspection(data: InspectionReportInput): Promise<InspectionReport> {
    await simulateLatency();

    const report: InspectionReport = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const result = await supabase
      .from("inspections")
      .insert(inspectionToRow(report))
      .select("*")
      .single();
    return inspectionFromRow(assertNoError(result, "createInspection") as InspectionRow);
  }

  async updateInspection(
    id: string,
    data: Partial<InspectionReportInput>,
  ): Promise<InspectionReport> {
    await simulateLatency();

    const existing = await this.getInspectionById(id);
    if (!existing) {
      throw new Error("Inspection report not found");
    }

    const updatedReport: InspectionReport = {
      ...existing,
      ...data,
    };

    const result = await supabase
      .from("inspections")
      .update(inspectionToRow(updatedReport))
      .eq("id", id)
      .select("*")
      .single();
    return inspectionFromRow(assertNoError(result, "updateInspection") as InspectionRow);
  }

  async deleteInspection(id: string): Promise<void> {
    await simulateLatency();
    const result = await supabase.from("inspections").delete().eq("id", id);
    assertNoError(result, "deleteInspection");
  }
}

const inspectionRepository = new InspectionRepository();

export async function getInspections(): Promise<InspectionReport[]> {
  return inspectionRepository.getInspections();
}

export async function getInspectionById(
  id: string,
): Promise<InspectionReport | null> {
  return inspectionRepository.getInspectionById(id);
}

export async function getInspectionsByJobId(
  jobId: string,
): Promise<InspectionReport[]> {
  return inspectionRepository.getInspectionsByJobId(jobId);
}

export async function createInspection(
  data: InspectionReportInput,
): Promise<InspectionReport> {
  return inspectionRepository.createInspection(data);
}

export async function updateInspection(
  id: string,
  data: Partial<InspectionReportInput>,
): Promise<InspectionReport> {
  return inspectionRepository.updateInspection(id, data);
}

export async function deleteInspection(id: string): Promise<void> {
  return inspectionRepository.deleteInspection(id);
}
