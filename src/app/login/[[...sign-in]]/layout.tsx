import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión - typewars.io",
  description:
    "Accede a typewars.io y mejora tu velocidad de escritura. La mejor plataforma para practicar typing con desafíos en vivo.",
  openGraph: {
    title: "Iniciar Sesión - typewars.io",
    description:
      "Accede a typewars.io y mejora tu velocidad de escritura. La mejor plataforma para practicar typing con desafíos en vivo.",
    type: "website",
    url: "https://typewars.io/login",
    siteName: "typewars.io",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Iniciar Sesión en typewars.io - Mejora tu velocidad de escritura",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Iniciar Sesión - typewars.io",
    description:
      "Accede a typewars.io y mejora tu velocidad de escritura. La mejor plataforma para practicar typing con desafíos en vivo.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false, // No indexar página de login
    follow: false,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ea580c",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative  overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:24px_24px] opacity-30" />

      {/* Header */}
      {/* <header className="relative z-10 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">11</span>
              </div>
              <span className="text-xl font-semibold text-white">Dev 11</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Características
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Competencias
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Ranking
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Comunidad
              </a>
            </nav>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">
                <span className="inline-flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  1,247 developers en línea
                </span>
              </div>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main content */}
      <main className="relative z-10 ">{children}</main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full relative z-10 border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center text-sm text-gray-400">
            <div className="text-center text-gray-400 text-sm">
              <p>© 2025 typewars.io</p>
              <p className="mt-2">
                made with ❤️ by{" "}
                <a
                  href="https://github.com/Ronald-Prato"
                  target="_blank"
                  className="text-orange-500"
                >
                  Ronald Prato
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
