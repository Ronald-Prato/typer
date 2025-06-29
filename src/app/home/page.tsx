"use client";

import { useRef, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Modal, ModalRefProps } from "@/components";
import { Text } from "@/components/Typography";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [isStarting, setIsStarting] = useState(false);
  const [selectedMode, setSelectedMode] = useState("");
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const modalRef = useRef<ModalRefProps>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleStartPractice = () => {
    setIsStarting(true);
    // Simulate loading practice session
    setTimeout(() => {
      setIsStarting(false);
      // Here you would navigate to the practice page
      alert("¡Preparando tu sesión de práctica!");
    }, 2000);
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
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/50 relative z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">11</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Dev 11</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* <span className="text-sm text-gray-300">
                ¡Hola, {user?.firstName || user?.username}!
              </span> */}
              {/* <span className="text-sm text-gray-300">
                2,437 developers practicando
              </span> */}
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
      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              className={`flex flex-col items-start justify-center bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer transition-all duration-100 hover:scale-105 hover:bg-gray-900 ${
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

          <div>
            <Button
              onClick={() => alert()}
              // loading
              disabled={!selectedMode}
              className="min-w-[300px]"
            >
              <Text variant="h6" className="text-white italic font-bold">
                Empezar
              </Text>
            </Button>
          </div>

          {/* Stats Section */}
          {/* <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-orange-500">2,437</div>
              <div className="text-gray-400">Developers Practicando</div>
            </div>
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-green-400">1,256</div>
              <div className="text-gray-400">Errores Encontrados Hoy</div>
            </div>
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-800">
              <div className="text-3xl font-bold text-blue-400">87%</div>
              <div className="text-gray-400">Precisión Promedio</div>
            </div>
          </div> */}

          {/* Recent Practice Sessions */}
          {/* <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">
              Últimas Sesiones de Práctica
            </h3>
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="space-y-4">
                {[
                  {
                    user: "CodeMaster",
                    errors: 5,
                    found: 4,
                    time: "3:45",
                    language: "JavaScript",
                  },
                  {
                    user: "PythonPro",
                    errors: 3,
                    found: 3,
                    time: "2:12",
                    language: "Python",
                  },
                  {
                    user: "JavaNinja",
                    errors: 7,
                    found: 6,
                    time: "5:30",
                    language: "Java",
                  },
                ].map((session, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">
                        #{index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-400 font-medium">
                          {session.user}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">
                          {session.language}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {session.found}/{session.errors} errores encontrados
                      </div>
                      <div className="text-xs text-gray-500">
                        Tiempo: {session.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

          {/* Language Stats */}
          {/* <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">
              Lenguajes de Práctica
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "JavaScript", exercises: 234, color: "bg-yellow-500" },
                { name: "Python", exercises: 189, color: "bg-blue-500" },
                { name: "Java", exercises: 156, color: "bg-red-500" },
                { name: "TypeScript", exercises: 98, color: "bg-blue-600" },
              ].map((lang) => (
                <div
                  key={lang.name}
                  className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      {lang.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {lang.exercises} ejercicios
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/80 rounded-full h-2">
                    <div
                      className={`${lang.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${(lang.exercises / 234) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Practice Tips */}
          {/* <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-center text-white">
              Consejos para la Práctica
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Lee el código completo
                    </h4>
                    <p className="text-sm text-gray-400">
                      Antes de buscar errores, entiende qué debería hacer el
                      código
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">
                      Errores comunes
                    </h4>
                    <p className="text-sm text-gray-400">
                      Sintaxis, variables no declaradas, paréntesis faltantes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-gray-950/95 backdrop-blur-sm border-t border-gray-800/50 mt-12 relative z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>
              © 2024 Dev 11 - Plataforma de práctica de conocimientos de
              programación
            </p>
            <p className="mt-2">
              Desarrollado con Next.js, Tailwind CSS y Clerk
            </p>
          </div>
        </div>
      </footer> */}

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
    </div>
  );
}
