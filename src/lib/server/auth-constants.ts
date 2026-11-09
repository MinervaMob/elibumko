/**
 * Authentication Constants for ElibUMKO Pustakawan & Admin Portal
 */

export const DEFAULT_LIBRARIAN = {
	name: 'Ilham Pangestu, S.Kom',
	email: 'pustakawan@umko.ac.id',
	password: 'pustakawan123',
	role: 'Pustakawan Utama',
	nidn: ''
} as const;

export const DEV_SESSION_COOKIE_NAME = 'elibumko_admin_session';
