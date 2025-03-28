"use client";
import Link from "next/link";

export default function NewClassroomButton() {
  return (
    <Link href="classroom/new">
      <button
        type="button"
        className="dark:focus:green-red-900 mb-2 me-2 rounded-lg border border-green-700 px-5 py-2.5 text-center text-sm font-medium text-green-700 hover:bg-green-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white"
      >
        Create a Classroom
      </button>
    </Link>
  );
}
