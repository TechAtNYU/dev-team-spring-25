"use server";
import { isUserAdminForClassroom } from "@/app/classroom/[classroomId]/upload/actions";
import { createServiceClient } from "@shared/utils/supabase/service-server";

export type DatasetClassroomConfig = {
  classroomId: string;
  classroomName: string;
};

export type DatasetClient = {
  classroomConfig: DatasetClassroomConfig;
  datasetId: string;
};

type DocumentFile = {
  id: string;
  datasetId: string;
  name: string;
  size: number;
  type: string;
  run?: string;
  status: string;
};

/**
 * Result from any operation that changes the client itself
 *
 * **MAKE SURE TO SET YOUR CLIENT TO THE RETURNED CLIENT FROM THIS**
 */
type DatasetMutableOperationResult = {
  client: DatasetClient;
};

// Might change later with more common fields for a non-client changing operation
type DatasetReadOnlyOperationResult = object;

/**
 * This function creates a DatasetClient for further operations. It either uses the dataset ID you give (which it assumes came from Supabase),
 * or retrieves the ID from supabase, or creates a new dataset. It will also verify that the ID given or retrieved is a valid dataset in RagFlow.
 * If the given ID is invalid or the ID from supabase is invalid, it will make a new dataset and set the field to the Supabase to reflect that.
 * @param classroomConfig Enter the basic classroom information that the client might need
 * @param datasetId Enter the dataset ID if you already have it from a previous Supabase call, otherwise this function will attempt to retrieve it
 * @returns a DatasetClient with a good DatasetID, otherwise null if there was an error
 */
export async function createDatasetClient(
  classroomConfig: DatasetClassroomConfig,
  datasetId: string | undefined = undefined
): Promise<DatasetMutableOperationResult | null> {
  try {
    if (!process.env.RAGFLOW_API_KEY || !process.env.RAGFLOW_API_URL) {
      throw Error("Ragflow API key and URL is required in the environment.");
    }
    let client: DatasetClient = {
      classroomConfig: classroomConfig,
      // only temporarily keeps this as "" before it deterministically is either
      // the user provided datasetId from the param or the one from supabase or a newly
      // created dataset's ID straight from Ragflow
      datasetId: datasetId ?? "",
    };

    // We treat a datasetId given to us in the params as if it was given to us by Supabase directly (so this just saves us a call)
    let supabaseHasDatasetId = true;
    if (!datasetId) {
      const attemptedRetrieval = await getClientWithRetrievedDatasetId(client);
      if (!attemptedRetrieval.supabaseSuccess) {
        throw Error(
          "Supabase fetch error, could not verify existence of/retrieve dataset ID."
        );
      }
      client = attemptedRetrieval.client;
      supabaseHasDatasetId = attemptedRetrieval.supabaseHasDatasetId;
    }
    // At this point, the client might have a dataset ID and supabaseHasDatasetId accurately reflects this
    // So we default to a dataset not existing and attempt to verify it if we have a valid ID in supabase
    let doesDatasetExist = false;

    if (supabaseHasDatasetId) {
      const verifyResult = await verifyDatasetExistence(client);
      if (!verifyResult.ragflowCallSuccess) {
        throw Error("RagFlow fetch error, could not verify dataset existence.");
      }
      doesDatasetExist = verifyResult.doesExist;
    }
    // This creation occurs if nothing was in supabase OR if the supabase ID was bad
    if (!doesDatasetExist) {
      const createResult = await createAssociatedDataset(client);
      if (!createResult.ragflowCallSuccess || !createResult.supabaseSuccess) {
        throw Error("Error creating dataset.");
      }
      client = createResult.client;
    }

    // Guaranteed to return a client with a good dataset behind it
    return { client };
  } catch (error) {
    console.error(
      `Error while creating Ragflow client for classroom ID ${classroomConfig.classroomId}`,
      error
    );
    return null;
  }
}

/**
 * Just returns boolean for whether the client's datasetId refers to a real/valid dataset in RagFlow
 * @param client Previously created client with `createDatasetClient()`
 * @returns `doesExist` for whether the dataset does exist within RagFlow. Verify credibility with ragflowCallSuccess
 */
export async function verifyDatasetExistence(client: DatasetClient): Promise<
  DatasetReadOnlyOperationResult & {
    ragflowCallSuccess: boolean;
    doesExist: boolean;
  }
> {
  const params = new URLSearchParams({ id: client.datasetId });
  const response = await fetch(`${getDatasetUrl()}?${params.toString()}`, {
    method: "GET",
    headers: getHeader(),
  });
  const jsonData = await response.json();
  if (!response.ok) {
    console.error(
      "DatasetService, verify dataset exist, Ragflow fetch error:",
      jsonData
    );
    return { ragflowCallSuccess: false, doesExist: false };
  }
  if (!jsonData?.data?.length) {
    return { ragflowCallSuccess: true, doesExist: false };
  }
  return { ragflowCallSuccess: true, doesExist: true };
}

/**
 * A call to get a mutated client object with the dataset ID of a newly created Ragflow dataset.
 * Also makes sure to update this ID within Supabase.
 * @param client Previously created client with `createDatasetClient()`
 * @returns A mutated client with an updated dataset ID. Verify credibility if true for both `ragflowCallSuccess` and `supabaseSuccess`
 */
export async function createAssociatedDataset(client: DatasetClient): Promise<
  DatasetMutableOperationResult & {
    ragflowCallSuccess: boolean;
    supabaseSuccess: boolean;
  }
> {
  // First: make the call to Ragflow to create a dataset with correct properties
  const timestamp = Date.now();
  const datasetName = `${client.classroomConfig.classroomName}_${timestamp}_${client.classroomConfig.classroomId.substring(0, 6)}`;
  const ragflowResponse = await fetch(getDatasetUrl(), {
    method: "POST",
    headers: getHeader(),
    body: JSON.stringify({
      name: datasetName,
    }),
  });
  // Verify the Ragflow API call result
  const ragflowResponseData = await ragflowResponse.json();
  if (!ragflowResponse.ok) {
    console.error(
      "DatasetService, creating dataset in RAGFlow:",
      ragflowResponseData
    );
    return {
      client: client,
      ragflowCallSuccess: false,
      supabaseSuccess: false,
    };
  }
  const ragflowDatasetId = ragflowResponseData.data.id;

  // Insert the new dataset's ID into Supabase
  const supabase = await createServiceClient();
  const { data: updatedRow, error } = await supabase
    .from("Classrooms")
    .update({ ragflow_dataset_id: ragflowDatasetId })
    .eq("id", Number(client.classroomConfig.classroomId))
    .select()
    .single();

  // Verify that Supabase was successfully updated
  if (error || !updatedRow.ragflow_dataset_id) {
    console.error(
      `DatasetService, creating dataset in RAGFlow, failed to update supabase: ${error} | updated row: ${updatedRow}`
    );
    return {
      client: client,
      ragflowCallSuccess: true,
      supabaseSuccess: false,
    };
  }

  // Return the updated client with the new dataset ID
  return {
    client: { ...client, datasetId: ragflowDatasetId },
    ragflowCallSuccess: true,
    supabaseSuccess: true,
  };
}

/**
 * A call to get a mutated client object with the dataset ID (attempted) retrieved from Supabase
 * @param client Client to perform operation on
 * @returns A mutated client with an updated dataset ID (although this is only updated if and only if supabaseHasDatasetId is also true).
 * Verify credibility of attempt with `supabaseSuccess`.
 */
export async function getClientWithRetrievedDatasetId(
  client: DatasetClient
): Promise<
  DatasetMutableOperationResult & {
    supabaseSuccess: boolean;
    supabaseHasDatasetId: boolean;
  }
> {
  // Retrieve the dataset ID from Supabase using the classroom ID
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .select("ragflow_dataset_id")
    .eq("id", Number(client.classroomConfig.classroomId))
    .single();

  // Error out if Supabase fails
  if (error || !data) {
    console.error(
      `Failed to fetch dataset id from supabase for classroom: ${error}`
    );
    return {
      client: client,
      supabaseSuccess: false,
      supabaseHasDatasetId: false,
    };
  }

  // If the row is missing the dataset ID, note that with supabaseHasDatasetId
  if (!data.ragflow_dataset_id) {
    return {
      client: client,
      supabaseSuccess: true,
      supabaseHasDatasetId: false,
    };
  }

  return {
    client: { ...client, datasetId: data.ragflow_dataset_id },
    supabaseSuccess: true,
    supabaseHasDatasetId: true,
  };
}

/**
 * Retrieves the documents within a given Ragflow dataset
 * @param client Previously created client with `createDatasetClient()`
 * @returns `files` are the returned files from Ragflow. Verify credibility with ragflowCallSuccess
 */
export async function retrieveDocuments(client: DatasetClient): Promise<
  DatasetReadOnlyOperationResult & {
    ragflowCallSuccess: boolean;
    files: DocumentFile[];
  }
> {
  // TODO: might need to change these params to paginate if we have more files
  const params = new URLSearchParams({
    page: "1",
    page_size: "30",
    orderby: "create_time",
    desc: "true",
  });
  const response = await fetch(
    `${getDatasetUrl()}/${client.datasetId}/documents?${params.toString()}`,
    {
      method: "GET",
      headers: getHeader(),
    }
  );
  const jsonData = await response.json();
  if (!response.ok) {
    console.error(
      "DatasetService, retrieve documents, Ragflow fetch error:",
      jsonData
    );
    return { ragflowCallSuccess: false, files: [] };
  }
  if (jsonData.code !== 0) {
    return {
      ragflowCallSuccess: false,
      files: [],
    };
  }
  const filesList: DocumentFile[] = jsonData.data.docs.map(
    (file: DocumentFile) => ({
      id: file.id,
      datasetId: client.datasetId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: file.run !== undefined ? file.run : "PENDING",
    })
  );
  return { ragflowCallSuccess: true, files: filesList };
}

/**
 * Uploads a file to the client's dataset. Note that this does complete the upload but only starts the parse,
 * it doesn't wait for it to finish.
 * @param client Previously created client with `createDatasetClient()`
 * @param formData Form with `file` as an attribute with a `File` object from a form
 * @returns a list of `files` if a successful upload and parse start. Also: use `isAdmin`, `uploadCallSuccess`, and
 * `parseCallSuccess` to verify if those different stages were successful.
 */
export async function uploadFile(
  client: DatasetClient,
  formData: FormData
): Promise<
  DatasetReadOnlyOperationResult & {
    isAdmin: boolean;
    uploadCallSuccess: boolean;
    parseCallSuccess: boolean;
    files: DocumentFile[];
  }
> {
  // Check if the user is the admin for this classroom (need to move the isUser function somewhere else later)
  const isAdmin = await isUserAdminForClassroom(
    Number(client.classroomConfig.classroomId)
  );

  // Disallows usage if not admin
  if (!isAdmin) {
    return {
      isAdmin: false,
      uploadCallSuccess: false,
      parseCallSuccess: false,
      files: [],
    };
  }

  // Makes the upload file call
  const uploadResponse = await fetch(
    `${getDatasetUrl()}/${client.datasetId}/documents`,
    {
      method: "POST",
      headers: { Authorization: getHeader().Authorization },
      body: formData,
    }
  );
  // Make sure that the upload was successful
  const uploadJsonData = await uploadResponse.json();
  if (!uploadResponse.ok || (uploadJsonData && !uploadJsonData?.data?.length)) {
    console.error(
      "DatasetService, upload documents, Ragflow call error:",
      uploadJsonData
    );
    return {
      isAdmin: true,
      uploadCallSuccess: false,
      parseCallSuccess: false,
      files: [],
    };
  }

  // Use the newly created file ID to initiate a parse
  const fileId = uploadJsonData.data[0].id;
  const parseResponse = await fetch(
    `${getDatasetUrl()}/${client.datasetId}/chunks`,
    {
      method: "POST",
      headers: getHeader(),
      body: JSON.stringify({ document_ids: [fileId] }),
    }
  );

  // Ensure that the parse started correctly
  const parseJsonData = await parseResponse.json();
  if (!parseResponse.ok || parseJsonData.code !== 0) {
    return {
      isAdmin: true,
      uploadCallSuccess: true,
      parseCallSuccess: false,
      files: [],
    };
  }

  // Return a fresh list of documents for the client, note that this only waits for the parse to start, not finish
  const { files: fileList } = await retrieveDocuments(client);
  return {
    isAdmin: true,
    uploadCallSuccess: true,
    parseCallSuccess: true,
    files: fileList,
  };
}

/**
 * Deletes a dataset for a given datasetId (or the id as retrieved from a classroom if no datasetId),
 * This doesn't follow the usual pattern of using a `datasetClient` because we don't want to
 * verify/create/etc a new dataset if we're just trying to delete it.
 * @param classroomId
 * @param datasetId
 */
export async function deleteDataset(
  classroomId: string,
  datasetId: string | undefined
): Promise<{ ragflowCallSuccess: boolean }> {
  //
  if (!process.env.RAGFLOW_API_KEY || !process.env.RAGFLOW_API_URL) {
    console.error("DatasetClient, deletion function, no API key or URL");
    return { ragflowCallSuccess: false };
  }

  // Default to using the datasetId provided, but attempt to retrieve it from Supabase
  // if the user didn't provide a datasetId
  let datasetIdToUse = datasetId;
  if (!datasetId) {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("Classrooms")
      .select("ragflow_dataset_id")
      .eq("id", Number(classroomId))
      .single();

    if (!error && data && data.ragflow_dataset_id) {
      datasetIdToUse = data.ragflow_dataset_id;
    }
  }

  // performs delete with Ragflow
  const response = await fetch(getDatasetUrl(), {
    method: "DELETE",
    headers: getHeader(),
    body: JSON.stringify({
      ids: [datasetIdToUse],
    }),
  });

  // Verifies that the call was successful
  const jsonData = await response.json();
  if (!response.ok) {
    console.error(
      "DatasetService, delete dataset exist, Ragflow call error:",
      jsonData
    );
    return { ragflowCallSuccess: false };
  }

  return { ragflowCallSuccess: true };
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

const getDatasetUrl = () => {
  return `${stripTrailingSlash(process.env.RAGFLOW_API_URL!)}/api/v1/datasets`; // definite assertion (!) since verified in "constructor"
};

const getHeader = () => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.RAGFLOW_API_KEY!}`, // definite assertion (!) since verified in "constructor"
  };
};
