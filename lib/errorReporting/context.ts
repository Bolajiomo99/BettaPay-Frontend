/**
 * Context capture for error reports.
 *
 * Collects the coarse application state that makes a production stack trace
 * actionable — which route, whether a session was active, which wallet
 * connector was in play — while deliberately omitting anything identifying.
 *
 * Wallet state arrives through a registered provider rather than a direct
 * import: `lib/api/axios.ts` pulls this module in, and a static import of the
 * wallet store would drag the Stellar SDK into every route's bundle.
 */

import { normalizeRoute } from '../rum/normalize';
import type { ErrorContext } from './types';

export interface WalletContextSnapshot {
  connected: boolean;
  connector: string | null;
  network: string | null;
}

let walletContextProvider: (() => WalletContextSnapshot) | null = null;

/**
 * Register a wallet-state source. Called by the wallet store at module load,
 * so wallet context is present exactly when wallet code is on the page.
 */
export function setWalletContextProvider(
  provider: (() => WalletContextSnapshot) | null
): void {
  walletContextProvider = provider;
}

function readWalletContext(): WalletContextSnapshot {
  if (!walletContextProvider) {
    return { connected: false, connector: null, network: null };
  }
  try {
    return walletContextProvider();
  } catch {
    return { connected: false, connector: null, network: null };
  }
}

function readAuthContext(): { isAuthenticated: boolean; role: string | null } {
  try {
    // Import lazily to avoid a circular dependency at module initialization time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('../store/authStore');
    const state = useAuthStore.getState();
    // Role only — never the user object, email, or token.
    return { isAuthenticated: state.isAuthenticated, role: state.role ?? null };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

function readViewport(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return `${window.innerWidth}x${window.innerHeight}`;
  } catch {
    return undefined;
  }
}

/**
 * Build the PII-free context attached to every outgoing error report.
 */
export function captureContext(routeOverride?: string): ErrorContext {
  const auth = readAuthContext();
  const wallet = readWalletContext();

  const rawRoute =
    routeOverride ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');

  return {
    route: normalizeRoute(rawRoute),
    isAuthenticated: auth.isAuthenticated,
    role: auth.role,
    walletConnected: wallet.connected,
    walletConnector: wallet.connector,
    walletNetwork: wallet.network,
    online:
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true,
    viewport: readViewport(),
  };
}
