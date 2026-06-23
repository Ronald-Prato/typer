const fallbackVersion = "local";

export const dynamic = "force-dynamic";

function getProductionVersion() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.npm_package_version ||
    fallbackVersion
  );
}

export function GET() {
  return Response.json(
    {
      version: getProductionVersion(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
