import type { PageServerLoad, Actions } from './$types';
import { categoryService } from '#lib/server/services';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [ddcTree, categories] = await Promise.all([
		categoryService.getDdcTree(),
		categoryService.getCategories()
	]);

	return {
		ddcTree,
		categories
	};
};

export const actions: Actions = {
	addClassification: async ({ request }) => {
		const formData = await request.formData();
		const code = formData.get('code')?.toString()?.trim();
		const name = formData.get('name')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim() || undefined;
		const color = (formData.get('color')?.toString()?.trim() as 'brick' | 'terracotta' | 'sand' | 'ink') || 'brick';
		const parentCode = formData.get('parentCode')?.toString()?.trim() || undefined;
		const isCustom = formData.get('isCustom') === 'true';

		if (!code || !name) {
			return fail(400, { error: 'Kode klasifikasi dan nama wajib diisi.' });
		}

		const result = await categoryService.addClassification({
			code,
			name,
			description,
			color,
			parentCode,
			isCustom
		});

		if (!result.success) {
			return fail(400, { error: result.message });
		}

		return { success: true, message: result.message };
	},

	editClassification: async ({ request }) => {
		const formData = await request.formData();
		const code = formData.get('code')?.toString()?.trim();
		const name = formData.get('name')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim() || undefined;
		const color = (formData.get('color')?.toString()?.trim() as 'brick' | 'terracotta' | 'sand' | 'ink') || undefined;

		if (!code || !name) {
			return fail(400, { error: 'Kode dan nama klasifikasi wajib diisi.' });
		}

		const result = await categoryService.updateClassification(code, {
			name,
			description,
			color
		});

		if (!result.success) {
			return fail(400, { error: result.message });
		}

		return { success: true, message: result.message };
	},

	deleteClassification: async ({ request }) => {
		const formData = await request.formData();
		const code = formData.get('code')?.toString()?.trim();

		if (!code) {
			return fail(400, { error: 'Kode klasifikasi tidak valid.' });
		}

		const result = await categoryService.deleteClassification(code);

		if (!result.success) {
			return fail(400, { error: result.message });
		}

		return { success: true, message: result.message };
	}
};
