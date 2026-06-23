export type VersionUpdateStateInput = {
  initialVersion: string | null;
  latestVersion: string | null;
  notifiedVersion?: string | null;
};

const normalizeVersion = (version: string | null | undefined) => {
  const trimmedVersion = version?.trim();

  return trimmedVersion ? trimmedVersion : null;
};

export function shouldNotifyProductionVersionUpdate({
  initialVersion,
  latestVersion,
  notifiedVersion = null,
}: VersionUpdateStateInput) {
  const normalizedInitialVersion = normalizeVersion(initialVersion);
  const normalizedLatestVersion = normalizeVersion(latestVersion);
  const normalizedNotifiedVersion = normalizeVersion(notifiedVersion);

  if (!normalizedInitialVersion || !normalizedLatestVersion) {
    return false;
  }

  return (
    normalizedLatestVersion !== normalizedInitialVersion &&
    normalizedLatestVersion !== normalizedNotifiedVersion
  );
}
