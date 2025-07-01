"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
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
            Typeala
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

          <Button
            onClick={handleCreateProfile}
            disabled={!nickname.trim() || isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Creando perfil...
              </div>
            ) : (
              "Comenzar"
            )}
          </Button>
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
