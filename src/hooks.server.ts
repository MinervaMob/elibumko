import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { DEFAULT_LIBRARIAN, DEV_SESSION_COOKIE_NAME } from '#lib/server/auth-constants.ts';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	try {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	} catch {
		// Suppress database connection errors when PostgreSQL is starting or offline
	}

	// Fallback dev session for seamless offline development & evaluations
	if (!event.locals.user) {
		const devCookie = event.cookies.get(DEV_SESSION_COOKIE_NAME);
		if (devCookie === 'active') {
			event.locals.user = {
				id: 'pustakawan-umko-mulyadi',
				name: DEFAULT_LIBRARIAN.name,
				email: DEFAULT_LIBRARIAN.email,
				emailVerified: true,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			event.locals.session = {
				id: 'session-pustakawan-umko',
				userId: 'pustakawan-umko-mulyadi',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				token: 'dev-token',
				createdAt: new Date(),
				updatedAt: new Date(),
				ipAddress: null,
				userAgent: null
			};
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
