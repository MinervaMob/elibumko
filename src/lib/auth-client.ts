import { createAuthClient } from 'better-auth/svelte';

/**
 * Modern Better Auth client for SvelteKit / Svelte 5.
 * Provides reactive session queries and authentication helper methods.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
