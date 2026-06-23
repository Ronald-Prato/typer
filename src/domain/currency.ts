export const TYPOCOIN_REWARD_FOR_1V1_WIN = 10;
export const TYPOCOIN_LABEL = "typocoins";

export interface LegacyTypocoinUser {
  gold?: number | null;
}

export function getTypocoinBalanceFromUser(
  user: LegacyTypocoinUser | null | undefined
) {
  return user?.gold ?? 0;
}

export function formatTypocoinAmount(
  amount: number,
  options: { signed?: boolean } = {}
) {
  const formattedAmount = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(amount);

  if (options.signed && amount > 0) {
    return `+${formattedAmount}`;
  }

  return formattedAmount;
}

export function formatTypocoinLabel(
  amount: number,
  options: { signed?: boolean } = {}
) {
  return `${formatTypocoinAmount(amount, options)} ${TYPOCOIN_LABEL}`;
}
