"use client";

import { useRef, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ModalRefProps } from "@/components";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function HomePage() {
  const [isStarting, setIsStarting] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const modalRef = useRef<ModalRefProps>(null);

  const createGame = useMutation(api.game.createGame);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStartPractice = async () => {
    try {
      setIsStarting(true);
      const game = await createGame({
        language: "javascript",
        difficulty: "easy",
        name: "Encuentra el Error",
      });

      if (!game) {
        throw new Error("Failed to create game");
      }

      router.push(`/find-the-bug?id=${game}`);
    } catch (error) {
      console.error(error);
      setIsStarting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="h-full text-white relative">
      {/* Header */}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        {/* <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              ¡Encuentra y corrige errores de código!
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Practica tus conocimientos de programación identificando y
              solucionando errores en código real
            </p>
          </div> */}

        {/* Practice Modes */}
        <div className="flex flex-col gap-6">
          <button
            className={`max-w-[20rem] flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer transition-all duration-100 hover:scale-105 hover:bg-gray-900 ${
              selectedMode === "findTheError"
                ? "border-orange-500 bg-gray-800/90"
                : "border-gray-700 hover:border-gray-600"
            }`}
            onClick={() => {
              setSelectedMode("findTheError");
              modalRef.current?.openModal();
            }}
          >
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2 text-white">
              Encuentra el Error
            </h3>
            <p className="text-gray-400 text-sm mb-3 text-left">
              Encuentra el error en el código proporcionado
            </p>
          </button>
        </div>
      </main>

      {/* <Modal ref={modalRef}>
        <Modal.Content>
          <div className="flex flex-col items-start justify-center">
            <Text variant="h6" className="text-gray-700">
              Encuentra el Error
            </Text>
            <Text variant="body1" className="text-gray-400 mt-4">
              Identifica y corrige el error en el siguiente código
            </Text>

            <div className="">

            </div>
          </div>
        </Modal.Content>
      </Modal> */}

      <div className="absolute bottom-0 left-0 w-full flex justify-start">
        <Button
          loading={isStarting}
          disabled={!selectedMode}
          onClick={handleStartPractice}
          className="min-w-[300px] py-10"
        >
          <Text variant="h6" className="text-white italic font-bold">
            Empezar
          </Text>
        </Button>
      </div>
    </div>
  );
}
