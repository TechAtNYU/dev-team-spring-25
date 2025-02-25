"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME + " " || "";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  let errorMessage = "You are not authorized to access this page.";

  if (message === "ORGANIZATION_EMAIL_REQUIRED") {
    errorMessage = `This application is only available to ${orgName}members with an approved email domain.`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
      <p className="mb-6">{errorMessage}</p>
      <Link
        href="/login"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Return to Login
      </Link>
    </div>
  );
}
