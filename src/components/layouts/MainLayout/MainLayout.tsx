import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white relative grid grid-rows-[80px_1fr_100px]">
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

      {/* Fixed centered isometric image - behind everything */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative opacity-10">
          <Image
            src="/assets/img/dev11isometric.png"
            alt="Dev 11 Isometric"
            width={800}
            height={600}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Page content - above the background image */}
      <div className="relative h-full z-10 px-12 py-12 flex flex-col items-center justify-center">
        <div className="w-full h-full max-w-[60rem] mx-auto">{children}</div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950/95 backdrop-blur-sm border-t border-gray-800/50  relative z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2024 Dev 11</p>
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
      </footer>
    </div>
  );
}
