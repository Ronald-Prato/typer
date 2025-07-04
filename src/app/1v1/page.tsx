"use client";

import { MainLayout } from "@/components";
import { Stage1 } from "@/components/domains/1v1";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBotMatch } from "@/hooks";

export default function OneVsOnePage() {
  const router = useRouter();
  const handleStageCompleted = () => {};

  const ownUser = useQuery(api.user.getOwnUser);

  useBotMatch();

  useEffect(() => {
    if (!ownUser) return;

    if (!ownUser.activeGame) {
      router.push("/home");
    }
  }, [ownUser]);

  return (
    <MainLayout withOutImage>
      <div className="flex flex-col justify-start h-full w-full">
        <Stage1 onStageCompleted={handleStageCompleted} />
      </div>
    </MainLayout>
  );
}
