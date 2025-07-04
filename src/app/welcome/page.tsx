"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

export default function WelcomePage() {
  const { user } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_, setAvatarSeed] = useState("");
  const [avatarSvg, setAvatarSvg] = useState("");

  const createUser = useMutation(api.user.createUser);

  const dbUser = useQuery(api.user.getOwnUser);

  const generateAvatar = (seed: string) => {
    const avatar = createAvatar(avataaars, {
      seed: seed,
      size: 96,
    });

    setAvatarSvg(avatar.toString());
  };

  const randomizeAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(newSeed);
    generateAvatar(newSeed);
  };

  useEffect(() => {
    if (dbUser?.nickname) {
      router.push("/home");
    }
  }, [dbUser]);

  useEffect(() => {
    // Generate initial avatar
    const initialSeed = user?.id || Math.random().toString(36).substring(7);
    setAvatarSeed(initialSeed);
    generateAvatar(initialSeed);
  }, [user?.id]);

  const handleCreateProfile = async () => {
    if (!user || !nickname.trim()) return;

    setIsLoading(true);
    try {
      await createUser({
        authId: user.id,
        avatar: avatarSvg,
        nickname: nickname.trim(),
        email: user.emailAddresses[0]?.emailAddress || "",
      });

      router.push("/home");
    } catch (error) {
      console.error("Error creating user:", error);
      setIsLoading(false);
    }
  };

  // Listen for Enter key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && nickname.trim() && !isLoading) {
        event.preventDefault();
        handleCreateProfile();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [nickname, isLoading]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Text variant="h4" className="text-white mb-2">
            typewars.io
          </Text>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Avatar Selector */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Tu Avatar
            </label>

            <div className="flex flex-col items-center space-y-4">
              {/* Avatar Display */}
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden flex items-center justify-center relative">
                {avatarSvg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: avatarSvg }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: "scale(1)",
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Randomize Button */}
              <Button
                onClick={randomizeAvatar}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1"
              >
                🎲 Randomizar
              </Button>
            </div>
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nombre de usuario
            </label>
            <Input
              id="nickname"
              type="text"
              placeholder="Ingresa tu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div className="w-full flex justify-center">
            <Button
              onClick={handleCreateProfile}
              disabled={!nickname.trim() || isLoading}
              className="w-full py-8 relative"
            >
              <div className="flex items-center space-x-4">
                <Text variant="h6" className="text-white font-bold">
                  {isLoading ? "Creando perfil..." : "Comenzar"}
                </Text>
                {/* Enter Key */}
                <div
                  className="w-12 h-6 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center justify-center border border-white/30"
                  style={{
                    boxShadow:
                      "0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
                  }}
                >
                  ↵
                </div>
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="text-center pt-6 border-t border-gray-800">
          <Text variant="body2" className="text-gray-400">
            Conectado como{" "}
            <span className="text-white">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          </Text>
        </div>
      </div>
    </div>
  );
}
