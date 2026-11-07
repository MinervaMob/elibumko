import { repository } from '../db/repository';
import type { LibraryProfile, LibrarySettings } from '#lib/types';

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
		const { storageLimitGB: _, ...profile } = settings;
		return profile;
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
		const { storageLimitGB: _, ...profile } = updated;
		return profile;
	}
}

export const settingsService = new SettingsService();
