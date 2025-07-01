"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Avatar } from "@/components";
import Link from "next/link";

export default function MainLayout({
  children,
  withOutImage = false,
}: {
  children: React.ReactNode;
  withOutImage?: boolean;
}) {
  const { isSignedIn } = useUser();
  return (
    <div className="min-h-screen bg-gray-950 text-white relative grid grid-rows-[80px_1fr_100px]">
      <header className="bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/50 relative z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/home">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white">Typeala</h1>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>

              {isSignedIn && <Avatar size="sm" />}
            </div>
          </div>
        </div>
      </header>

      {/* Fixed centered isometric image - behind everything */}
      {!withOutImage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative opacity-20">
            <Image
              src="/assets/img/typerlogo.png"
              alt="Typeala Isometric"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      {/* Page content - above the background image */}
      <div className="relative h-full z-10 px-12 py-12 flex flex-col items-center justify-center">
        <div className="w-full h-full max-w-[60rem] mx-auto">{children}</div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950/95 backdrop-blur-sm border-t border-gray-800/50  relative z-20">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2024 Typeala</p>
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
