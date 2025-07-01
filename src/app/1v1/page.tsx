"use client";

import { useState } from "react";
import { MainLayout, Racer, Text } from "@/components";
import { Stage1 } from "@/components/domains/1v1";

export default function OneVsOnePage() {
  const [stage, setStage] = useState<"1" | "2">("1");

  return (
    <MainLayout withOutImage>
      <div className="flex flex-col justify-start h-full w-full">
        <Text variant="h5" className="text-center mb-4">
          Stage {stage}
        </Text>

        {stage === "1" && <Stage1 onStageCompleted={() => setStage("2")} />}
      </div>
    </MainLayout>
  );
}
