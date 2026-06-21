"use client";

import { MainLayout } from "@/components";
import { Stage1 } from "@/components/domains/1v1";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function OneVsOnePage() {
  const router = useRouter();
  const handleStageCompleted = () => {};

  const ownUser = useCurrentUser();
  const gameData = useQuery(api.game.getGameData);

  useEffect(() => {
    if (!ownUser) return;

    if (!ownUser.activeGame) {
      router.push("/home");
    }
  }, [ownUser, router]);

  useEffect(() => {
    if (gameData?.game?.mode === "scroll") {
      router.push("/scroll");
    }
  }, [gameData?.game?.mode, router]);

  return (
    <MainLayout>
      <div className="flex flex-col justify-start h-full w-full">
        <Stage1 onStageCompleted={handleStageCompleted} />
      </div>
    </MainLayout>
  );
}
