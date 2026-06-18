"use server";

import type {
  InspectionReport,
  InspectionReportInput,
} from "../models/Inspection";
import { readData, writeData } from "../db";
import { generateId } from "../generateId";
import { simulateLatency } from "./delay";

const FILE_NAME = "inspections.json";

class InspectionRepository {
  async getInspections(): Promise<InspectionReport[]> {
    await simulateLatency();
    return readData<InspectionReport[]>(FILE_NAME);
  }

  async getInspectionById(id: string): Promise<InspectionReport | null> {
    await simulateLatency();
    const inspections = await readData<InspectionReport[]>(FILE_NAME);
    return inspections.find((report) => report.id === id) ?? null;
  }

  async getInspectionsByJobId(jobId: string): Promise<InspectionReport[]> {
    await simulateLatency();
    const inspections = await readData<InspectionReport[]>(FILE_NAME);
    return inspections
      .filter((report) => report.jobId === jobId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async createInspection(data: InspectionReportInput): Promise<InspectionReport> {
    await simulateLatency();

    const report: InspectionReport = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const inspections = await readData<InspectionReport[]>(FILE_NAME);
    inspections.unshift(report);
    await writeData(FILE_NAME, inspections);

    return report;
  }

  async updateInspection(
    id: string,
    data: Partial<InspectionReportInput>,
  ): Promise<InspectionReport> {
    await simulateLatency();

    const inspections = await readData<InspectionReport[]>(FILE_NAME);
    const index = inspections.findIndex((report) => report.id === id);
    if (index === -1) {
      throw new Error("Inspection report not found");
    }

    const updatedReport: InspectionReport = {
      ...inspections[index],
      ...data,
    };
    inspections[index] = updatedReport;
    await writeData(FILE_NAME, inspections);

    return updatedReport;
  }

  async deleteInspection(id: string): Promise<void> {
    await simulateLatency();

    const inspections = await readData<InspectionReport[]>(FILE_NAME);
    const updated = inspections.filter((report) => report.id !== id);
    await writeData(FILE_NAME, updated);
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
