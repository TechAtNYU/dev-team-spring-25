"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { uploadFile } from "./actions";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const data = await uploadFile(formData);
    console.log(data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-xl font-bold">File Upload</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={!file}
            className="w-full rounded-md bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Upload
          </button>
        </form>

        {file && (
          <div className="mt-4 rounded-md bg-gray-100 p-3">
            <p>
              <strong>Selected file:</strong> {file.name}
            </p>
            <p>
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
            </p>
            <p>
              <strong>Type:</strong> {file.type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
