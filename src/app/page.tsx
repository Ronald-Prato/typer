import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export default async function HomePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await fetchQuery(api.user.getUser, {
    authId: user.id,
  });

  if (dbUser) {
    redirect("/home");
  } else {
    redirect("/welcome");
  }
}
