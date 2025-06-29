"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const codeSnippets = [
    "function fibonacci(n) {",
    "const quickSort = (arr) => {",
    "class Component extends React {",
    "async function fetchData() {",
    "export default function App() {",
  ];

  useEffect(() => {
    const currentSnippet = codeSnippets[currentIndex];
    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          if (typedText.length < currentSnippet.length) {
            setTypedText(currentSnippet.slice(0, typedText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (typedText.length > 0) {
            setTypedText(typedText.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % codeSnippets.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timer);
  }, [typedText, currentIndex, isDeleting]);

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:24px_24px] opacity-30" />

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">11</span>
              </div>
              <span className="text-2xl font-bold text-white">Dev 11</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Features
              </a>
              <a
                href="#challenges"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Challenges
              </a>
              <a
                href="#leaderboard"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Leaderboard
              </a>
              <a
                href="#community"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Community
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Comenzar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6">
              La plataforma definitiva de
              <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                typing para developers
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Compite con developers de todo el mundo escribiendo código real en
              tiempo real. Mejora tu velocidad, precisión y dominio de múltiples
              lenguajes de programación.
            </p>

            {/* Code typing simulation */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 max-w-2xl mx-auto mb-12">
              <div className="flex items-center mb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="ml-4 text-sm text-gray-400">
                  dev-challenge.js
                </span>
              </div>
              <div className="font-mono text-left">
                <span className="text-green-400">{typedText}</span>
                <span className="animate-pulse text-orange-500">|</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Comenzar Desafío
              </Link>
              <Link
                href="#demo"
                className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
              >
                Ver Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                15,000+
              </div>
              <div className="text-gray-400">Developers activos</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="text-3xl font-bold text-green-400 mb-2">
                500K+
              </div>
              <div className="text-gray-400">Desafíos completados</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="text-3xl font-bold text-blue-400 mb-2">25+</div>
              <div className="text-gray-400">Lenguajes soportados</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                150+
              </div>
              <div className="text-gray-400">Empresas participando</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">
              ¿Por qué elegir <span className="text-orange-500">Dev 11</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              La plataforma más completa para mejorar tus habilidades de
              programación a través de competencias de typing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold mb-4 text-white">Código Real</h3>
              <p className="text-gray-400">
                Practica con fragmentos de código auténticos de proyectos reales
                en más de 25 lenguajes de programación diferentes.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Competencias en Tiempo Real
              </h3>
              <p className="text-gray-400">
                Compite contra developers de todo el mundo en desafíos 1v1,
                torneos y competencias por equipos.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Analytics Avanzados
              </h3>
              <p className="text-gray-400">
                Rastrea tu progreso con métricas detalladas de velocidad,
                precisión y mejora por lenguaje.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Leaderboards Globales
              </h3>
              <p className="text-gray-400">
                Sube en los rankings globales y por empresa. Demuestra tu
                dominio técnico y velocidad de coding.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Equipos y Empresas
              </h3>
              <p className="text-gray-400">
                Organiza competencias internas en tu empresa o únete a bootcamps
                para competir por equipos.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Práctica Personalizada
              </h3>
              <p className="text-gray-400">
                Enfócate en tus lenguajes favoritos o desafíate con nuevas
                tecnologías. Personaliza tu experiencia.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl p-12 border border-orange-500/20 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">
              ¿Listo para el desafío?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Únete a miles de developers que ya están mejorando sus habilidades
              y compitiendo en Dev 11
            </p>
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Comenzar Gratis Ahora
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">11</span>
                </div>
                <span className="text-xl font-bold text-white">Dev 11</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                La plataforma definitiva para developers que quieren mejorar su
                velocidad de programación y competir con los mejores.
              </p>
              <div className="text-sm text-gray-500">
                © 2024 Dev 11. Todos los derechos reservados.
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Comunidad</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
