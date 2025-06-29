"use client";

import { FindTheBugPageContent } from "@/components/domains/find-the-bug";
import { Button } from "@/components/ui/button";
import { api, internal } from "../../../convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { useTransition } from "react";
import { useSearchParams } from "next/navigation";

export default function FindTheBugPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // const createSnippet = useMutation(api.snippets.createSnippet);
  // const createSnippets = useAction(api.snippets.createSnippetsAction);
  const game = useQuery(api.game.getGameById, {
    id: searchParams.get("id") as Id<"game">,
  });

  if (!game) {
    return <div>Game not found</div>;
  }

  return <FindTheBugPageContent game={game} />;
}
