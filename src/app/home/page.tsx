"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const [isSearching, setIsSearching] = useState(false);
  const [gameMode, setGameMode] = useState("classic");
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStartMatch = () => {
    setIsSearching(true);
    // Simulate searching for opponent
    setTimeout(() => {
      setIsSearching(false);
      // Here you would navigate to the game page
      alert("¡Oponente encontrado! Preparando desafío...");
    }, 3000);
  };

  const gameModes = [
    {
      id: "classic",
      name: "Code Challenge",
      description: "1v1 - Escribe código real de diferentes lenguajes",
      icon: "💻",
      players: "2 developers",
    },
    {
      id: "speed",
      name: "Speed Coding",
      description: "Contra el tiempo - Completa funciones en 60 segundos",
      icon: "⚡",
      players: "1 developer",
    },
    {
      id: "tournament",
      name: "Dev Tournament",
      description: "Eliminación directa - Bootcamps y empresas tech",
      icon: "🏆",
      players: "4-16 developers",
    },
  ];

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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">11</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Dev 11</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                ¡Hola, {user?.firstName || user?.username}!
              </span>
              <span className="text-sm text-gray-300">
                2,437 developers online
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              ¡Demuestra tu velocidad de código!
            </h2>
            {/* <p className="text-xl text-gray-300 mb-8">
              Compite con developers de todo el mundo en desafíos de
              programación en tiempo real
            </p> */}
          </div>

          {/* Game Modes */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {gameModes.map((mode) => (
              <div
                key={mode.id}
                className={`bg-gray-900 rounded-2xl p-6 border cursor-pointer transition-all duration-300 hover:scale-105 ${
                  gameMode === mode.id
                    ? "border-orange-500 bg-gray-800"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setGameMode(mode.id)}
              >
                <div className="text-4xl mb-4">{mode.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-white">
                  {mode.name}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{mode.description}</p>
                <span className="inline-block bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                  {mode.players}
                </span>
              </div>
            ))}
          </div>

          {/* Start Match Button */}
          <div className="text-center">
            <button
              onClick={handleStartMatch}
              disabled={isSearching}
              className={`px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                isSearching
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105 shadow-lg hover:shadow-xl"
              }`}
            >
              {isSearching ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Buscando developer...</span>
                </div>
              ) : (
                "🚀 Iniciar Desafío"
              )}
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-orange-500">2,437</div>
              <div className="text-gray-400">Developers Online</div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-green-400">156</div>
              <div className="text-gray-400">Desafíos Activos</div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-blue-400">89</div>
              <div className="text-gray-400">CPM Promedio</div>
            </div>
          </div>

          {/* Recent Matches */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">
              Desafíos Recientes
            </h3>
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="space-y-4">
                {[
                  {
                    player1: "ReactMaster",
                    player2: "VueNinja",
                    winner: "ReactMaster",
                    cpm: "145",
                    language: "JavaScript",
                  },
                  {
                    player1: "PythonGuru",
                    player2: "JavaDev",
                    winner: "JavaDev",
                    cpm: "132",
                    language: "Python",
                  },
                  {
                    player1: "RustaceanX",
                    player2: "GoSpeed",
                    winner: "RustaceanX",
                    cpm: "158",
                    language: "Rust",
                  },
                ].map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">
                        #{index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={
                            match.winner === match.player1
                              ? "text-orange-400 font-bold"
                              : "text-gray-300"
                          }
                        >
                          {match.player1}
                        </span>
                        <span className="text-gray-500">vs</span>
                        <span
                          className={
                            match.winner === match.player2
                              ? "text-orange-400 font-bold"
                              : "text-gray-300"
                          }
                        >
                          {match.player2}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        Ganador: {match.winner}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.cpm} CPM • {match.language}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Language Stats */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">
              Lenguajes Populares
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "JavaScript", percentage: 34, color: "bg-yellow-500" },
                { name: "Python", percentage: 28, color: "bg-blue-500" },
                { name: "TypeScript", percentage: 22, color: "bg-blue-600" },
                { name: "Java", percentage: 16, color: "bg-red-500" },
              ].map((lang) => (
                <div
                  key={lang.name}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {lang.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {lang.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${lang.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${lang.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950/80 backdrop-blur-sm border-t border-gray-800/50 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2024 Dev 11 - La plataforma definitiva para developers</p>
            <p className="mt-2">
              Desarrollado con Next.js, Tailwind CSS y Clerk
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
