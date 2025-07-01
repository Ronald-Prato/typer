"use client";

import { MainLayout } from "@/components";
import { Stage1 } from "@/components/domains/1v1";

export default function OneVsOnePage() {
  const handleStageCompleted = () => {};

  return (
    <MainLayout withOutImage>
      <div className="flex flex-col justify-start h-full w-full">
        <Stage1 onStageCompleted={handleStageCompleted} />
      </div>
    </MainLayout>
  );
}
