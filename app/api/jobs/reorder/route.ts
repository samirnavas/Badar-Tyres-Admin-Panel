import { NextResponse } from "next/server";
import { updateJobQueueOrder } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobIds } = body;

    if (!Array.isArray(jobIds)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await updateJobQueueOrder(jobIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder jobs:", error);
    return NextResponse.json(
      { error: "Failed to reorder jobs" },
      { status: 500 }
    );
  }
}
