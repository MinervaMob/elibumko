import { repository } from '../db/repository';
import type { CategoryData, ClassificationNode } from '#lib/types';

export class CategoryService {
	/**
	 * Dapatkan seluruh kategori dengan jumlah buku terhitung secara riil
	 */
	async getCategories(): Promise<CategoryData[]> {
		return repository.getCategories();
	}

	/**
	 * Dapatkan pohon klasifikasi DDC dengan hierarki dan jumlah buku terhitung secara riil
	 */
	async getDdcTree(): Promise<ClassificationNode[]> {
		return repository.getDdcTree();
	}

	/**
	 * Ambil satu kategori berdasarkan kode DDC atau slug
	 */
	async getCategoryByCode(code: string): Promise<CategoryData | null> {
		const categories = await repository.getCategories();
		return categories.find((c) => c.code === code) ?? null;
	}

	/**
	 * Ambil node pohon DDC berdasarkan kode
	 */
	async getDdcNodeByCode(code: string): Promise<ClassificationNode | null> {
		const tree = await repository.getDdcTree();
		return tree.find((n) => n.code === code) ?? null;
	}

	/**
	 * Tambah klasifikasi utama (koleksi khusus) atau sub-klasifikasi
	 */
	async addClassification(data: {
		code: string;
		name: string;
		description?: string;
		color?: 'brick' | 'terracotta' | 'sand' | 'ink';
		parentCode?: string;
		isCustom?: boolean;
	}): Promise<{ success: boolean; message: string }> {
		return repository.addClassification(data);
	}

	/**
	 * Sunting nama, deskripsi, atau palet warna klasifikasi
	 */
	async updateClassification(
		code: string,
		updates: { name: string; description?: string; color?: 'brick' | 'terracotta' | 'sand' | 'ink' }
	): Promise<{ success: boolean; message: string }> {
		return repository.updateClassification(code, updates);
	}

	/**
	 * Hapus klasifikasi dengan validasi keterikatan koleksi buku
	 */
	async deleteClassification(code: string): Promise<{ success: boolean; message: string }> {
		return repository.deleteClassification(code);
	}
}

export const categoryService = new CategoryService();
