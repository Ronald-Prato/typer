import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "typewars.io",
  description: "La mejor plataforma para practicar typing",
  openGraph: {
    title: "typewars.io",
    description: "La mejor plataforma para practicar typing",
    type: "website",
    url: "https://typewars.io",
    siteName: "typewars.io",
    images: [
      {
        url: "/og-image.png", // Puedes agregar una imagen personalizada
        width: 1200,
        height: 630,
        alt: "typewars.io - La mejor plataforma para practicar typing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "typewars.io",
    description: "La mejor plataforma para practicar typing",
    images: ["/og-image.png"], // Misma imagen para Twitter
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ea580c", // Color naranja que coincide con tu tema
};

export default async function HomePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await fetchQuery(api.user.getUserByAuthId, {
    authId: user.id,
  });

  if (dbUser) redirect("/home");
  redirect("/welcome");
}
