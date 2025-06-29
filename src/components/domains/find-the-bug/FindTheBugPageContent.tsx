"use client";

import { FindTheBug } from "@/components";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { motion } from "framer-motion";

interface FindTheBugPageContentProps {
  game: {
    _id: Id<"game">;
    name: string;
    difficulty: string;
    language: string;
    snippets: {
      id: Id<"snippet"> | undefined;
      code: string;
      language: string;
      difficulty: string;
    }[];
  };
}

export function FindTheBugPageContent({ game }: FindTheBugPageContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingNewSnippet, setIsLoadingNewSnippet] = useState(false);

  const handleSuccess = () => {
    setTimeout(() => {
      setIsLoadingNewSnippet(true);
      setCurrentIndex((prev) => prev + 1);
    }, 1000);
    setTimeout(() => {
      setIsLoadingNewSnippet(false);
    }, 1010);
  };

  const handleError = (error: string) => {
    console.log("Error en compilación:", error);
  };

  // Ejemplo de ejercicio
  const exercise = {
    code: game.snippets[currentIndex].code,
    language: game.language,
    difficulty: game.difficulty as "easy" | "medium" | "hard",
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.6,
      }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
            {game.name}
          </h1>
          <p className="text-gray-300 text-lg">
            Revisa el código y encuentra el error que está causando problemas
          </p>
        </div>

        {!isLoadingNewSnippet && (
          <FindTheBug
            exercise={exercise}
            onError={handleError}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </motion.div>
  );
}
