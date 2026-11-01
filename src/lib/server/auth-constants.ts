/**
 * Authentication Constants for ElibUMKO Pustakawan & Admin Portal
 */

export const DEFAULT_LIBRARIAN = {
	name: 'Drs. H. Mulyadi, M.Pd.',
	email: 'pustakawan@umko.ac.id',
	password: 'pustakawan123',
	role: 'Pustakawan Utama',
	nidn: '0214056801'
} as const;

export const DEV_SESSION_COOKIE_NAME = 'elibumko_admin_session';
