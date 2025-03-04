import { NextResponse, NextRequest } from "next/server";

const RAGFLOW_API_KEY: string = process.env.NEXT_RAGFLOW_API_KEY || "";
const RAGFLOW_SERVER_URL: string = "https://ragflow.dev.techatnyu.org";

export async function GET() {
  // TODO: Return the JSON output that RAGFlow API returns on documents from "upload_documents_test"?
  return NextResponse.json({
    status: "FROG",
  });
}

export async function POST(request: NextRequest) {
  if (!RAGFLOW_API_KEY) {
    return NextResponse.json({
      status: "ERROR",
      message:
        "You need to get a RAGFlow API key from: https://ragflow.dev.techatnyu.org/user-setting/api and set it in your .env.local file as NEXT_RAGFLOW_API_KEY.",
    });
  }

  const datasetResponse = await listDatasets("upload_documents_test");
  const datasetId = datasetResponse.data[0].id;
  const formData = await request.formData();
  const result = await uploadDocuments(datasetId, formData);
  // TODO: Immediately parse the document right after upload for now
  return NextResponse.json({
    status: "SUCCESS",
    datasetId,
    result,
  });
}

// ====================================================
// RAGFlow API functions
// TODO: Move these to a separate RAGFlow client file
// ====================================================

// TODO: Give the option to pass in other optional arguments
// See more at: https://ragflow.dev.techatnyu.org/user-setting/api#list-datasets
async function listDatasets(name: string) {
  const params = new URLSearchParams({ name });
  const response = await fetch(
    `${RAGFLOW_SERVER_URL}/api/v1/datasets?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${RAGFLOW_API_KEY}`,
      },
    }
  );
  return await response.json();
}

async function uploadDocuments(datasetId: string, formData: FormData) {
  const response = await fetch(
    `${RAGFLOW_SERVER_URL}/api/v1/datasets/${datasetId}/documents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${RAGFLOW_API_KEY}`,
      },
      body: formData,
    }
  );
  return await response.json();
}
