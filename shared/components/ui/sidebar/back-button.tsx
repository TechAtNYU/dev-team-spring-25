"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      className="inline-flex h-fit items-center rounded-full border px-2 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      effect={"hoverUnderlineInvert"}
      variant={"default"}
      onClick={() => {
        router.back();
      }}
    >
      <ArrowLeft /> Back
    </Button>
  );
}
