import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Text } from "../Typography";
import { motion, AnimatePresence } from "framer-motion";
import { User, Clock, Trophy, Activity } from "lucide-react";
import { Button } from "../ui/button";

interface FriendListProps {
  onAddFriend: () => void;
}

// Skeleton component for loading state
const FriendSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30"
  >
    <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-700 rounded animate-pulse w-24"></div>
      <div className="h-3 bg-gray-700 rounded animate-pulse w-16"></div>
    </div>
    <div className="w-3 h-3 bg-gray-700 rounded-full animate-pulse"></div>
  </motion.div>
);

// Status indicator component
const StatusIndicator = ({ status }: { status?: string }) => {
  const getStatusText = (status?: string) => {
    switch (status) {
      case "online":
        return "En línea";
      case "in_queue":
        return "En cola";
      case "game_found":
        return "En partida";
      case "in_game":
        return "En partida";
      default:
        return "Desconocido";
    }
  };

  return (
    <Text variant="caption" className="text-gray-400 flex items-center gap-2">
      {getStatusText(status)}
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </Text>
  );
};

export function FriendList({ onAddFriend }: FriendListProps) {
  const friends = useQuery(api.user.getFriends);

  if (friends === undefined) {
    // Loading state with skeleton animations
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FriendSkeleton />
          </motion.div>
        ))}
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center h-full space-y-4"
      >
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center space-y-2 flex flex-col items-center">
          <Text variant="body1" className="text-gray-300">
            No has agregado a ningún amigo
          </Text>
          <Text variant="caption" className="text-gray-500">
            Agrega amigos para ver sus estadísticas y estado
          </Text>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={onAddFriend}>
          Agregar amigo
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {friends.map((friend, index) => (
          <motion.div
            key={friend._id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: "easeOut",
            }}
            className="mt-4 group p-4 bg-gray-800/30 rounded-lg border border-gray-700/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {friend.avatar ? (
                  <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center">
                    <div
                      dangerouslySetInnerHTML={{ __html: friend.avatar }}
                      className="w-full h-full flex items-center justify-center"
                      style={{ transform: "scale(1)" }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {friend.nickname
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"}
                  </div>
                )}
              </div>

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Text
                    variant="body1"
                    className="font-medium text-white truncate"
                  >
                    {friend.nickname}
                  </Text>

                  <StatusIndicator status={friend.status} />
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  {/* Games Count */}
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>{friend.games?.length || 0} juegos</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
