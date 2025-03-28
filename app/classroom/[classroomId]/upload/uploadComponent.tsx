"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createDatasetClient,
  DatasetClient,
  retrieveDocuments,
  uploadFile,
} from "@shared/lib/ragflow/dataset-client";
import { Input } from "@shared/components/ui/input";
import { toast } from "@shared/hooks/use-toast";
import { Skeleton } from "@shared/components/ui/skeleton";
import { ScrollArea } from "@shared/components/ui/scroll-area";

type UploadedFile = {
  id: string;
  datasetId: string;
  name: string;
  size: number;
  type: string;
  status: string;
};

export default function UploadComponent({
  classroomId,
  classroomName,
}: {
  classroomId: string;
  classroomName: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | null>(
    null
  );
  const [datasetClient, setDatasetClient] = useState<DatasetClient>();
  const [loading, setLoading] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchFiles() {
      let clientToUse = datasetClient;
      if (!clientToUse) {
        const result = await createDatasetClient({
          classroomId,
          classroomName,
        });
        if (result) {
          clientToUse = result.client;
          setDatasetClient(clientToUse);
        } else {
          return;
        }
      }
      const retrieveResult = await retrieveDocuments(clientToUse);
      console.log("retrieve: ", retrieveResult);
      if (!retrieveResult.ragflowCallSuccess) {
        return;
      }
      setUploadedFiles(retrieveResult.files);
    }

    fetchFiles();
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, [classroomId, classroomName, datasetClient]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    if (!datasetClient) {
      return;
    }
    const response = await uploadFile(datasetClient, formData);

    toast({
      title: "Upload started!",
      description: `Document ${file.name} has uploaded and began parsing`,
      duration: 10000,
    });
    setLoading(false);

    // if (!response || typeof response !== "object") {
    //   setErrorMessage("Invalid response from server.");
    //   return;
    // }
    if (
      response.isAdmin &&
      response.parseCallSuccess &&
      response.uploadCallSuccess
    ) {
      setUploadedFiles(response.files);
      setFile(null);
      if (inputFile.current) {
        inputFile.current.value = "";
      }
    }
    // } else {
    //   setErrorMessage(response.message || "Failed to upload file.");
    // }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-xl font-bold">File Upload</h1>
        {datasetClient == undefined || uploadedFiles == null ? (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  ref={inputFile}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </form>

            {/* Move to component with files passed in as props so that newly fetch data doesn't trigger a rerender (and thus another fetch) infinitely so*/}
            <FileList uploadedFiles={uploadedFiles} />
          </>
        )}
      </div>
    </div>
  );
}

function FileList({ uploadedFiles }: { uploadedFiles: UploadedFile[] }) {
  const pathname = usePathname();
  return (
    uploadedFiles.length > 0 && (
      <ScrollArea className="mt-5 max-h-[50vh] rounded-md border px-3">
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Uploaded Files</h2>
          <ul className="my-2 space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="rounded-md bg-gray-100 p-3">
                <Link
                  href={`${pathname}/preview?documentId=${file.id}&datasetId=${file.datasetId}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="font-medium"
                >
                  {file.name}
                </Link>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB - {file.type} -{" "}
                  <strong>{file.status}</strong>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    )
  );
}
