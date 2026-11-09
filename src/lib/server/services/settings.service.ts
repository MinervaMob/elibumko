import { repository } from '../db/repository';
import type { LibraryProfile, LibrarySettings, LibrarianProfile } from '#lib/types';

export class SettingsService {
	/**
	 * Dapatkan pengaturan sistem perpustakaan dan kuota
	 */
	async getSettings(): Promise<LibrarySettings> {
		return repository.getLibrarySettings();
	}

	/**
	 * Dapatkan profil publik institusi perpustakaan
	 */
	async getProfile(): Promise<LibraryProfile> {
		const settings = await repository.getLibrarySettings();
		const { storageLimitGB: _, storageDriver: __, customStoragePath: ___, ...profile } = settings;
		return profile as LibraryProfile;
	}

	/**
	 * Perbarui konfigurasi sistem perpustakaan
	 */
	async updateSettings(updates: Partial<LibrarySettings>): Promise<LibrarySettings> {
		return repository.updateLibrarySettings(updates);
	}

	/**
	 * Perbarui profil publik perpustakaan
	 */
	async updateProfile(updates: Partial<LibraryProfile>): Promise<LibraryProfile> {
		const updated = await repository.updateLibrarySettings(updates);
		const { storageLimitGB: _, storageDriver: __, customStoragePath: ___, ...profile } = updated;
		return profile as LibraryProfile;
	}

	/**
	 * Dapatkan profil pribadi pustakawan/admin
	 */
	async getLibrarianProfile(): Promise<LibrarianProfile> {
		return repository.getLibrarianProfile();
	}

	/**
	 * Perbarui data profil pribadi pustakawan
	 */
	async updateLibrarianProfile(updates: Partial<LibrarianProfile>): Promise<LibrarianProfile> {
		return repository.updateLibrarianProfile(updates);
	}

	/**
	 * Ganti kata sandi pustakawan
	 */
	async changeLibrarianPassword(
		oldPass: string,
		newPass: string
	): Promise<{ success: boolean; message: string }> {
		return repository.changeLibrarianPassword(oldPass, newPass);
	}
}

export const settingsService = new SettingsService();
