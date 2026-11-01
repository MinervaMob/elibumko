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
}

export const categoryService = new CategoryService();
