import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Detectamos si es ruta pública
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/$",
  "/callback",
  "/welcome",
  "/api/trpc(.*)",
]);

// 2. Definimos el prefijo del proxy
const proxyPrefix = "/analytics";
const posthogTarget = "https://us.posthog.com"; // cambia si usas EU o self-hosted

// 3. Middleware principal
export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;

  // Si es una ruta del proxy PostHog
  if (nextUrl.pathname.startsWith(proxyPrefix)) {
    const proxiedPath = nextUrl.pathname.replace(proxyPrefix, "");
    const proxiedUrl = `${posthogTarget}${proxiedPath}${nextUrl.search}`;

    return NextResponse.rewrite(new URL(proxiedUrl));
  }

  // Si no es pública, proteger con Clerk
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

// 4. Configuración del matcher
export const config = {
  matcher: [
    // Incluye las rutas normales más las del proxy
    "/analytics/:path*", // proxy PostHog
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/",
  ],
};
