"use client";

import ReactConfetti from "react-confetti";
import { motion, AnimatePresence } from "@/motion";
import { Text } from "@/components/Typography";
import { UserAvatarImage } from "@/components/Avatar";
import { MatchProgressBar } from "./MatchProgressBar";
import { useLowPerformanceMode } from "@/hooks";

interface MatchProgressViewProps {
  currentUser: any;
  currentUserSteps: number;
  isGameFinished: boolean;
  isWinner: boolean;
  opponent: any;
  opponentSteps: number;
  viewport: { width: number; height: number };
}

function PlayerAvatar({
  showTrophy,
  user,
}: {
  showTrophy?: boolean;
  user: any;
}) {
  return (
    <div className="relative">
      <UserAvatarImage
        avatarUrl={user?.avatarUrl}
        avatarSeed={user?.avatarSeed}
        nickname={user?.nickname}
        className="w-12 h-12"
        initialsClassName="text-sm"
      />
      {showTrophy && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute -top-2 -right-2 text-2xl"
        >
          🏆
        </motion.div>
      )}
    </div>
  );
}

function ResultBanner({
  isGameFinished,
  isWinner,
}: {
  isGameFinished: boolean;
  isWinner: boolean;
}) {
  return (
    <AnimatePresence>
      {isGameFinished && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-4 flex justify-center"
        >
          <motion.div className="rounded-lg p-3 text-center max-w-md w-fit">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-2xl mb-1"
            >
              {isWinner ? "🏆" : "❌"}
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Text
                variant="subtitle2"
                className={`font-bold text-white ${
                  isWinner ? "text-yellow-100" : "text-red-100"
                }`}
              >
                {isWinner ? "VICTORIA" : "DERROTA"}
              </Text>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlayersRow({
  currentUser,
  currentUserSteps,
  isGameFinished,
  isWinner,
  opponent,
  opponentSteps,
}: Omit<MatchProgressViewProps, "viewport">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex flex-col items-center space-y-2">
        <PlayerAvatar user={currentUser} />
        <Text variant="body2" className="text-white font-medium">
          {currentUser.nickname}
        </Text>
        <Text variant="caption" className="text-orange-400">
          {currentUserSteps}/4
        </Text>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg px-4 py-2 rounded-full shadow-lg">
        VS
      </div>

      <div className="flex flex-col items-center space-y-2">
        <PlayerAvatar user={opponent} showTrophy={isGameFinished && !isWinner} />
        <Text variant="body2" className="text-white font-medium">
          {opponent?.nickname || "Oponente"}
        </Text>
        <Text variant="caption" className="text-blue-400">
          {opponentSteps}/4
        </Text>
      </div>
    </motion.div>
  );
}

export function MatchProgressView(props: MatchProgressViewProps) {
  const { isLowPerformanceMode } = useLowPerformanceMode();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto"
    >
      <ResultBanner
        isGameFinished={props.isGameFinished}
        isWinner={props.isWinner}
      />

      {props.isGameFinished && props.isWinner && !isLowPerformanceMode && (
        <ReactConfetti
          width={props.viewport.width}
          height={props.viewport.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
          style={{
            top: 0,
            left: 0,
            position: "fixed",
            pointerEvents: "none",
          }}
        />
      )}

      <PlayersRow {...props} />
      <MatchProgressBar
        currentUserSteps={props.currentUserSteps}
        opponentSteps={props.opponentSteps}
      />
    </motion.div>
  );
}
