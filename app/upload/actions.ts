"use server";

const RAGFLOW_API_KEY: string = process.env.NEXT_RAGFLOW_API_KEY || "";
const RAGFLOW_SERVER_URL: string = "https://ragflow.dev.techatnyu.org";

export async function uploadFile(formData: FormData) {
  if (!RAGFLOW_API_KEY) {
    console.log(
      "You need to get a RAGFlow API key from: https://ragflow.dev.techatnyu.org/user-setting/api and set it in your .env.local file as NEXT_RAGFLOW_API_KEY."
    );
    return;
  }
  console.log(formData);
  const datasetResponse = await listDatasets("upload_documents_test");
  const datasetId = datasetResponse.data[0].id;
  const result = uploadDocuments(datasetId, formData);
  return result;
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
        Authorization: `Bearer ${RAGFLOW_API_KEY}`,
      },
      body: formData,
    }
  );
  return await response.json();
}
