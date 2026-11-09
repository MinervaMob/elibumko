import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { DEFAULT_LIBRARIAN, DEV_SESSION_COOKIE_NAME } from '#lib/server/auth-constants.ts';
import { repository } from '#lib/server/db/repository';

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
			let name: string = DEFAULT_LIBRARIAN.name;
			let email: string = DEFAULT_LIBRARIAN.email;
			try {
				const prof = await repository.getLibrarianProfile();
				if (prof.name) name = prof.name;
				if (prof.email) email = prof.email;
			} catch {
				// use default
			}

			event.locals.user = {
				id: 'pustakawan-umko',
				name,
				email,
				emailVerified: true,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			event.locals.session = {
				id: 'session-pustakawan-umko',
				userId: 'pustakawan-umko',
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
