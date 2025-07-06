"use client";
import { useRouter } from "next/navigation";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import { useResetAtom } from "jotai/utils";
import { practiceAtom } from "@/states/practice.states";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useUser } from "@clerk/nextjs";

const GAME_MODES = [
  { key: "1v1", label: "1V1", shortcut: "⏎", emoji: "⚔️" },
  { key: "practice", label: "PRÁCTICA", shortcut: "⏎", emoji: "🎯" },
];

export const Home = () => {
  const { user } = useUser();
  const router = useRouter();
  const ownUser = useQuery(api.user.getOwnUser);
  const [isPending, startTransition] = useTransition();
  const [userScore, setUserScore] = useState(0);
  const [keyPressed, setKeyPressed] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [keyboardHover, setKeyboardHover] = useState<{
    chevronLeft: boolean;
    chevronRight: boolean;
    button: boolean;
  }>({
    chevronLeft: false,
    chevronRight: false,
    button: false,
  });
  const [keyboardClick, setKeyboardClick] = useState(false);

  const resetPractice = useResetAtom(practiceAtom);
  const getInQueue = useMutation(api.queue.getInQueue);
  const exitQueue = useMutation(api.queue.exitQueue);

  // Detect OS for keyboard shortcuts
  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const exitShortcut = isMac ? "⌘ X" : "Ctrl+X";
  const startShortcut = isMac ? "⌘ Enter" : "Ctrl+Enter";

  // Generate random score on component mount
  useEffect(() => {
    setUserScore(Math.floor(Math.random() * 101)); // 0 to 100
  }, []);

  // Timer for queue
  useEffect(() => {
    if (!ownUser?.queuedAt) return;
    const initialSeconds = Math.max(
      0,
      Math.floor((Date.now() - ownUser.queuedAt) / 1000)
    );
    setQueueSeconds(initialSeconds);
    const interval = setInterval(() => {
      setQueueSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ownUser?.queuedAt]);

  const formatTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleExitQueue = () => {
    if (ownUser?.queueId) {
      startTransition(async () => {
        await exitQueue();
      });
    }
  };

  const handleStart = useCallback(async () => {
    const currentIndex = carouselApi?.selectedScrollSnap() || 0;
    const currentMode = GAME_MODES[currentIndex];
    if (currentMode.key === "practice") {
      resetPractice();
      router.push("/practice");
    } else if (currentMode.key === "1v1") {
      startTransition(async () => {
        await getInQueue({
          queueId: Math.random().toString(36).substring(2, 15),
        });
      });
    }
  }, [carouselApi, router, resetPractice, getInQueue]);

  const setKeyPressedState = (key: string) => {
    setKeyPressed(key);
    setTimeout(() => setKeyPressed(null), 200); // Reset after 200ms for smoother transitions
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Enter to start
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        setKeyboardClick(true);
        setTimeout(() => setKeyboardClick(false), 200);
        handleStart();
        return;
      }

      // Check for Cmd/Ctrl + X to exit queue
      if ((event.metaKey || event.ctrlKey) && event.key === "x") {
        event.preventDefault();
        handleExitQueue();
        return;
      }

      // Carousel navigation
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        carouselApi?.scrollPrev();
        setKeyboardHover({ ...keyboardHover, chevronLeft: true });
        setTimeout(
          () => setKeyboardHover({ ...keyboardHover, chevronLeft: false }),
          200
        );
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        carouselApi?.scrollNext();
        setKeyboardHover({ ...keyboardHover, chevronRight: true });
        setTimeout(
          () => setKeyboardHover({ ...keyboardHover, chevronRight: false }),
          200
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carouselApi, keyboardHover, handleStart, handleExitQueue]);

  return (
    <div className="h-full w-[55rem] flex flex-col items-center justify-center gap-12 px-12">
      {/* Left side - User Profile */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-[10rem] h-[10rem] rounded-full bg-gray-800 border-4 border-gray-600 overflow-hidden flex items-center justify-center relative shadow-lg">
            <div
              dangerouslySetInnerHTML={{ __html: ownUser?.avatar || "" }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: "scale(1.5)" }}
            />
          </div>
        </div>
        <div className="text-center">
          <Text
            variant="h4"
            className="text-white !font-extrabold mb-2 text-2xl"
          >
            {ownUser?.nickname || "Player"}
          </Text>
          <div className="flex items-center space-x-2 mt-4">
            <div className="w-4 h-4  bg-yellow-500 rounded-full"></div>
            <Text variant="body1" className="text-yellow-400 font-semibold">
              {userScore} pts
            </Text>
          </div>
        </div>
      </div>

      {/* Game Mode Carousel - perfectly centered with arrows */}
      <div className="flex flex-col items-center space-y-8 w-full">
        <div className="max-w-[22rem] relative grid grid-cols-[1fr_6fr_1fr] items-center gap-4 justify-center w-full">
          <button
            onClick={() => carouselApi?.scrollPrev()}
            className="flex justify-center items-center p-2 rounded-full cursor-pointer transition-all duration-300 hover:bg-white/20 backdrop-blur-sm text-white font-medium"
          >
            <ChevronLeft className="size-5" />
          </button>
          {!!ownUser?.queueId ? (
            <motion.div
              initial={{ opacity: 0, filter: "blur(16px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(16px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="z-10 flex flex-col items-center justify-center w-full"
            >
              <button
                onClick={handleExitQueue}
                className="!w-[22rem] bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg px-5 py-2 flex flex-col items-start justify-center"
              >
                <Text
                  variant="h5"
                  className="text-white !font-extrabold text-lg"
                >
                  En cola
                </Text>
                <Text variant="subtitle2" className="text-white font-bold">
                  {formatTime(queueSeconds)}
                </Text>

                <div
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                  className="cursor-pointer absolute right-3 bottom-3 px-1 py-0.5 bg-white/20 backdrop-blur-sm text-white font-medium rounded flex items-center justify-center border border-white/30"
                >
                  <Text
                    variant="caption"
                    className="text-white !font-extrabold"
                  >
                    {exitShortcut}
                  </Text>
                </div>
              </button>
            </motion.div>
          ) : (
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              setApi={setCarouselApi}
              className="w-[22rem] mx-auto relative"
            >
              <CarouselContent className="">
                {GAME_MODES.map((mode) => (
                  <CarouselItem
                    key={mode.key}
                    className="w-full flex justify-center items-center relative"
                  >
                    <motion.div
                      whileTap={
                        mode.key === "1v1" && !!ownUser?.queueId
                          ? undefined
                          : { scale: 0.95 }
                      }
                      onClick={
                        mode.key === "1v1" && !!ownUser?.queueId
                          ? undefined
                          : handleStart
                      }
                      initial={{ opacity: 0, filter: "blur(16px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(16px)" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "!w-[15rem] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg relative px-5 py-2 cursor-pointer text-xl font-extrabold tracking-wide text-center select-none border border-transparent transition-all",
                        keyPressed === "Enter" || keyboardClick
                          ? "scale-95 shadow-xl"
                          : "",
                        mode.key === "1v1" && !!ownUser?.queueId
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : ""
                      )}
                      style={{ minWidth: "100%" }}
                    >
                      {/* Keyboard shortcut indicator */}
                      <div
                        style={{
                          boxShadow:
                            "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                        }}
                        className="absolute right-3 bottom-3 px-1 py-0.5 bg-white/20 backdrop-blur-sm text-white font-medium rounded flex items-center justify-center border border-white/30"
                      >
                        <Text
                          variant="caption"
                          className="text-white !font-extrabold"
                        >
                          {startShortcut}
                        </Text>
                      </div>
                      <div className="flex flex-col items-start justify-center">
                        <Text
                          variant="h5"
                          className="text-white !font-extrabold"
                        >
                          {mode.key === "1v1" && !!ownUser?.queueId
                            ? "1V1"
                            : mode.label}
                        </Text>
                        <Text variant="body1" className="text-white opacity-70">
                          {mode.key === "1v1" && !!ownUser?.queueId
                            ? "En cola"
                            : mode.label === "1V1"
                              ? "Buscar partida"
                              : "Individual"}
                        </Text>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}

          <button
            onClick={() => carouselApi?.scrollNext()}
            className="flex justify-center items-center p-2 rounded-full cursor-pointer transition-all duration-300 hover:bg-white/20 backdrop-blur-sm text-white font-medium"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
