"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type AuthStrategy = "oauth_google" | "oauth_microsoft" | "oauth_facebook";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const [loadingStates, setLoadingStates] = useState<
    Record<AuthStrategy, boolean>
  >({
    oauth_google: false,
    oauth_microsoft: false,
    oauth_facebook: false,
  });

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/home");
    }
  }, [isSignedIn, router]);

  const authOptions: { name: string; icon: string; strategy: AuthStrategy }[] =
    [
      {
        name: "Google",
        icon: "/assets/svg/google.svg",
        strategy: "oauth_google",
      },
    ];

  if (!signIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const signInWith = async (strategy: AuthStrategy) => {
    setLoadingStates((prev) => ({ ...prev, [strategy]: true }));

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setLoadingStates((prev) => ({ ...prev, [strategy]: false }));
      console.error("Authentication error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6 shadow-lg">
            <span className="text-2xl font-bold text-white">11</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Typeala
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-8">
            La plataforma de<b> práctica de conocimiento </b>para developers
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            {authOptions.map((option) => (
              <Button
                key={option.strategy}
                onClick={() => signInWith(option.strategy)}
                disabled={loadingStates[option.strategy]}
                variant="outline"
                size="lg"
                className="w-full bg-gray-900 border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-white"
              >
                {loadingStates[option.strategy] ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Image
                      src={option.icon}
                      alt={`${option.name} icon`}
                      width={20}
                      height={20}
                      className="mr-3"
                    />
                    Continuar con {option.name}
                  </div>
                )}
              </Button>
            ))}
          </div>

          {/* Divider */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950 text-gray-400">
                O continúa con
              </span>
            </div>
          </div> */}

          {/* Alternative options */}
          {/* <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="default"
              disabled
              className="bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
            >
              📧 Email
            </Button>
            <Button
              variant="outline"
              size="default"
              disabled
              className="bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
            >
              💬 Discord
            </Button>
          </div> */}

          {/* <p className="text-xs text-gray-500 text-center">Próximamente</p> */}
        </div>

        {/* Stats */}
        {/* <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">2.4K+</div>
              <div className="text-xs text-gray-400">Developers</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">156</div>
              <div className="text-xs text-gray-400">Desafíos en vivo</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">89</div>
              <div className="text-xs text-gray-400">CPM Promedio</div>
            </div>
          </div>
        </div> */}

        {/* Footer */}
        {/* <div className="text-center text-xs text-gray-500 space-y-2">
          <p>
            Al continuar, aceptas nuestros{" "}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              Política de Privacidad
            </a>
          </p>
        </div> */}

        {/* Clerk Captcha Container */}
        <div id="clerk-captcha"></div>
      </div>
    </div>
  );
}
