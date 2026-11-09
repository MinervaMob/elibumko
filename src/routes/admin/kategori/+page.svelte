<script lang="ts">
	/**
	 * /admin/kategori — Modul CMS Klasifikasi DDC & Koleksi Khusus
	 *
	 * Fitur:
	 * - Mengelola 10 divisi utama Dewey Decimal Classification (DDC)
	 * - Tambah klasifikasi utama baru & koleksi khusus perguruan tinggi (AIK, Muatan Lokal, Skripsi)
	 * - Tambah, sunting, dan hapus sub-kelas klasifikasi rak digital
	 * - Pemetaan warna label rak (spine palette)
	 */

	import {
		FolderTree,
		Plus,
		ArrowLeft,
		CheckCircle2,
		AlertCircle,
		X,
		BookOpen,
		Pencil,
		Trash2,
		Sparkles,
		Layers
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { ClassificationNode } from '#lib/types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Modals state
	let isMainModalOpen = $state(false);
	let isSubModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);

	// Form values for adding main classification
	let mainClassType = $state<'ddc' | 'custom'>('custom');
	let newMainCode = $state('');
	let newMainName = $state('');
	let newMainDesc = $state('');
	let newMainColor = $state<'brick' | 'terracotta' | 'sand' | 'ink'>('brick');

	// Form values for adding subclass
	let targetParentCode = $state('000');
	let targetParentName = $state('');
	let newSubCode = $state('');
	let newSubName = $state('');

	// Form values for editing
	let editCode = $state('');
	let editName = $state('');
	let editDesc = $state('');
	let editColor = $state<'brick' | 'terracotta' | 'sand' | 'ink'>('brick');
	let isEditingSubclass = $state(false);

	// Form values for deleting
	let deleteTargetCode = $state('');
	let deleteTargetName = $state('');

	// Toast state
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toastMessage = msg;
		toastType = type;
		setTimeout(() => (toastMessage = null), 4000);
	}

	function openAddMainModal() {
		mainClassType = 'custom';
		newMainCode = '2X0';
		newMainName = '';
		newMainDesc = '';
		newMainColor = 'brick';
		isMainModalOpen = true;
	}

	function openAddSubModal(parentCode: string, parentName: string) {
		targetParentCode = parentCode;
		targetParentName = parentName;
		newSubCode =
			parentCode.length === 3 && /^\d+$/.test(parentCode)
				? parentCode.slice(0, 1) + '10'
				: parentCode + '-01';
		newSubName = '';
		isSubModalOpen = true;
	}

	function openEditModal(node: ClassificationNode, isSub: boolean = false) {
		editCode = node.code;
		editName = node.name;
		editDesc = node.description || '';
		editColor = node.color || 'brick';
		isEditingSubclass = isSub;
		isEditModalOpen = true;
	}

	function openDeleteModal(code: string, name: string) {
		deleteTargetCode = code;
		deleteTargetName = name;
		isDeleteModalOpen = true;
	}

	$effect(() => {
		if (form?.success && form.message) {
			showToast(form.message, 'success');
		} else if (form?.error) {
			showToast(form.error, 'error');
		}
	});

	function handleTypeChange(type: 'ddc' | 'custom') {
		mainClassType = type;
		if (type === 'custom') {
			if (!newMainCode || /^\d{3}$/.test(newMainCode)) newMainCode = '2X0';
		} else {
			newMainCode = '050';
		}
	}
</script>

<svelte:head>
	<title>Struktur Klasifikasi DDC & Koleksi Khusus — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="space-y-6">
	<!-- Toast Notification -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			{#if toastType === 'success'}
				<CheckCircle2 size={16} class="shrink-0 text-emerald-400" />
			{:else}
				<AlertCircle size={16} class="shrink-0 text-red-400" />
			{/if}
			<span>{toastMessage}</span>
		</div>
	{/if}

	<!-- Header -->
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-ink/15 pb-4 sm:flex-row sm:items-center"
	>
		<div class="flex items-center gap-3">
			<a
				href="/admin"
				class="focus-library rounded-sm border border-ink/15 p-2 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				title="Kembali ke Ringkasan"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<h2 class="font-serif text-xl leading-tight font-bold text-ink sm:text-2xl">
					Struktur Klasifikasi DDC & Koleksi Khusus
				</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Dewey Decimal Classification dan penataan rak muatan lokal / koleksi khusus kampus UMKO
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<span
				class="rounded-sm border border-ink/15 bg-sand/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink"
			>
				{data.ddcTree.length} Divisi Utama & Koleksi Aktif
			</span>

			<button
				type="button"
				onclick={openAddMainModal}
				class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-3 py-1.5 text-xs font-semibold text-cream shadow-xs transition-colors hover:bg-brick/90"
			>
				<Plus size={14} />
				<span>Tambah Klasifikasi Utama</span>
			</button>
		</div>
	</div>

	<!-- Information Banner: Best Practice Industri Perpustakaan -->
	<div class="rounded-lg border border-brick/20 bg-brick/5 p-4 text-xs text-ink">
		<div class="flex items-start gap-2.5">
			<Sparkles size={16} class="mt-0.5 shrink-0 text-brick" />
			<div>
				<p class="font-semibold text-brick">
					Standar Klasifikasi Perpustakaan Perguruan Tinggi Modern
				</p>
				<p class="mt-0.5 leading-relaxed text-ink-muted">
					Selain 10 divisi baku DDC (000–900), Anda dapat menambahkan <strong
						>Klasifikasi Utama Khusus</strong
					>
					seperti koleksi Al-Islam & Kemuhammadiyahan (<em>2X0</em> standar Kemenag), Koleksi
					Skripsi & Tugas Akhir (<em>TA</em>), atau Muatan Lokal Lampung (<em>ML</em>). Naskah
					digital yang diunggah akan langsung dapat dikelompokkan ke rak tersebut.
				</p>
			</div>
		</div>
	</div>

	<!-- DDC Class Cards Grid -->
	<div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
		{#each data.ddcTree as node (node.code)}
			<div
				class="catalog-card flex flex-col justify-between rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6"
			>
				<div>
					<!-- Class Header -->
					<div class="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
						<div class="flex min-w-0 items-start gap-2.5">
							<span
								class="shrink-0 rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-sm font-bold text-brick"
							>
								{node.code}
							</span>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="truncate font-serif text-base font-bold text-ink">
										{node.name}
									</h3>
									{#if node.isCustom}
										<span
											class="rounded bg-sand px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted"
										>
											Koleksi Khusus
										</span>
									{/if}
								</div>
								{#if node.description}
									<p class="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">
										{node.description}
									</p>
								{/if}
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-1">
							<span class="mr-1 font-mono text-xs font-semibold text-ink-muted">
								{node.count} judul
							</span>
							<button
								type="button"
								onclick={() => openEditModal(node, false)}
								class="rounded p-1 text-ink-muted transition-colors hover:bg-sand hover:text-ink"
								title="Sunting Klasifikasi"
							>
								<Pencil size={13} />
							</button>
							{#if node.isCustom || node.count === 0}
								<button
									type="button"
									onclick={() => openDeleteModal(node.code, node.name)}
									class="rounded p-1 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-700"
									title="Hapus Klasifikasi"
								>
									<Trash2 size={13} />
								</button>
							{/if}
						</div>
					</div>

					<!-- Subclasses list -->
					<div class="mt-3.5 space-y-2">
						{#if node.subclasses?.length}
							<ul class="space-y-1.5 border-l-2 border-brick/30 pl-2 text-xs">
								{#each node.subclasses as sub (sub.code)}
									<li
										class="group flex items-center justify-between gap-2 rounded px-1 py-0.5 text-ink-muted transition-colors hover:bg-sand/40 hover:text-ink"
									>
										<div class="flex min-w-0 items-center gap-1.5">
											<strong class="shrink-0 font-mono text-brick">{sub.code}</strong>
											<span class="truncate">{sub.name}</span>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											<span class="font-mono text-[11px] text-ink-muted/80">
												{sub.count} naskah
											</span>
											<div class="hidden items-center gap-0.5 group-hover:flex">
												<button
													type="button"
													onclick={() =>
														openEditModal(
															{ code: sub.code, name: sub.name, count: sub.count },
															true
														)}
													class="rounded p-0.5 text-ink-muted hover:text-ink"
													title="Sunting Sub-klasifikasi"
												>
													<Pencil size={11} />
												</button>
												{#if sub.count === 0}
													<button
														type="button"
														onclick={() => openDeleteModal(sub.code, sub.name)}
														class="rounded p-0.5 text-ink-muted hover:text-red-600"
														title="Hapus Sub-klasifikasi"
													>
														<Trash2 size={11} />
													</button>
												{/if}
											</div>
										</div>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="py-1 text-xs text-ink-muted italic">Belum ada sub-divisi terdaftar.</p>
						{/if}
					</div>
				</div>

				<!-- Card Footer -->
				<div class="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
					<a
						href="/rak/{node.code}"
						target="_blank"
						class="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-brick"
					>
						<BookOpen size={13} />
						<span>Lihat di Rak Publik</span>
					</a>

					<button
						type="button"
						onclick={() => openAddSubModal(node.code, node.name)}
						class="focus-library flex items-center gap-1 rounded p-1 text-xs font-semibold text-brick hover:underline"
					>
						<Plus size={13} />
						<span>Tambah Sub-divisi</span>
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- 1. Modal: Tambah Klasifikasi Utama / Koleksi Khusus -->
	{#if isMainModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="main-class-title"
		>
			<div
				class="w-full max-w-lg space-y-4 rounded-lg border border-ink/20 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)]"
			>
				<div class="flex items-center justify-between border-b border-ink/15 pb-2">
					<div class="flex items-center gap-2">
						<Layers size={18} class="text-brick" />
						<h3 id="main-class-title" class="font-serif text-base font-bold text-ink">
							Tambah Klasifikasi Utama / Koleksi Khusus
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (isMainModalOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						<X size={16} />
					</button>
				</div>

				<!-- Type Selector Tabs -->
				<div class="grid grid-cols-2 gap-2 rounded-lg bg-sand/40 p-1 text-xs font-semibold">
					<button
						type="button"
						class="rounded py-1.5 transition-all {mainClassType === 'custom'
							? 'bg-brick text-cream shadow-xs'
							: 'text-ink-muted hover:text-ink'}"
						onclick={() => handleTypeChange('custom')}
					>
						Koleksi Khusus / Muatan Lokal
					</button>
					<button
						type="button"
						class="rounded py-1.5 transition-all {mainClassType === 'ddc'
							? 'bg-brick text-cream shadow-xs'
							: 'text-ink-muted hover:text-ink'}"
						onclick={() => handleTypeChange('ddc')}
					>
						Divisi Standar DDC Baru
					</button>
				</div>

				<form
					method="POST"
					action="?/addClassification"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							isMainModalOpen = false;
						};
					}}
					class="space-y-4 text-xs sm:text-sm"
				>
					<input
						type="hidden"
						name="isCustom"
						value={mainClassType === 'custom' ? 'true' : 'false'}
					/>

					<div>
						<label for="main-code" class="mb-1 block text-xs font-semibold">
							Kode Klasifikasi / Rak *
						</label>
						<input
							id="main-code"
							name="code"
							type="text"
							required
							bind:value={newMainCode}
							placeholder={mainClassType === 'custom'
								? 'Contoh: 2X0, TA, ML, atau UMKO-01'
								: 'Contoh: 050 atau 990'}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink uppercase focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
						<p class="mt-1 text-[11px] text-ink-muted">
							{#if mainClassType === 'custom'}
								Dapat berupa kode alfanumerik bebas untuk kategori khusus (misal: <em>2X0</em> untuk
								Kemuhammadiyahan / Islam RI, <em>TA</em> untuk Tugas Akhir).
							{:else}
								Gunakan nomor kelas 3-digit Dewey Decimal Classification standar.
							{/if}
						</p>
					</div>

					<div>
						<label for="main-name" class="mb-1 block text-xs font-semibold">
							Nama Klasifikasi / Judul Rak *
						</label>
						<input
							id="main-name"
							name="name"
							type="text"
							required
							bind:value={newMainName}
							placeholder="Contoh: Studi Islam Indonesia & Kemuhammadiyahan"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div>
						<label for="main-desc" class="mb-1 block text-xs font-semibold">
							Deskripsi & Ruang Lingkup Kajian
						</label>
						<textarea
							id="main-desc"
							name="description"
							rows={2}
							bind:value={newMainDesc}
							placeholder="Contoh: Koleksi karya pemikiran Islam kontemporer, fiqih peradaban, dan sejarah persyarikatan..."
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						></textarea>
					</div>

					<div>
						<label for="main-color" class="mb-1 block text-xs font-semibold">
							Palet Warna Label Rak (Spine Accent)
						</label>
						<div class="grid grid-cols-4 gap-2">
							{#each [{ id: 'brick', label: 'Bata (Brick)', class: 'bg-[#9A3B3B]' }, { id: 'terracotta', label: 'Terracotta', class: 'bg-[#C08261]' }, { id: 'sand', label: 'Pasir (Sand)', class: 'bg-[#E2C799]' }, { id: 'ink', label: 'Tinta (Ink)', class: 'bg-[#2A1A16]' }] as col (col.id)}
								<label
									class="flex cursor-pointer items-center gap-1.5 rounded border border-ink/20 p-2 text-xs transition-colors hover:bg-sand/30 {newMainColor ===
									col.id
										? 'border-brick bg-brick/10 font-bold'
										: ''}"
								>
									<input
										type="radio"
										name="color"
										value={col.id}
										bind:group={newMainColor}
										class="sr-only"
									/>
									<span class="h-3.5 w-3.5 rounded-full {col.class}"></span>
									<span class="truncate text-[11px]">{col.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3">
						<button
							type="button"
							onclick={() => (isMainModalOpen = false)}
							class="rounded-md border border-ink/20 px-4 py-2 text-xs text-ink hover:bg-sand/60"
						>
							Batal
						</button>
						<button
							type="submit"
							class="rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream hover:bg-brick/90"
						>
							Simpan Klasifikasi Utama
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- 2. Modal: Tambah Sub-divisi -->
	{#if isSubModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="sub-title"
		>
			<div
				class="w-full max-w-md space-y-4 rounded-lg border border-ink/20 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)]"
			>
				<div class="flex items-center justify-between border-b border-ink/15 pb-2">
					<div class="flex items-center gap-2">
						<FolderTree size={18} class="text-brick" />
						<h3 id="sub-title" class="font-serif text-base font-bold text-ink">
							Tambah Sub-klasifikasi DDC
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (isSubModalOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						<X size={16} />
					</button>
				</div>

				<form
					method="POST"
					action="?/addClassification"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							isSubModalOpen = false;
						};
					}}
					class="space-y-4 text-xs sm:text-sm"
				>
					<input type="hidden" name="parentCode" value={targetParentCode} />

					<div>
						<label for="parent-code-view" class="mb-1 block text-xs font-semibold"
							>Divisi Induk</label
						>
						<input
							id="parent-code-view"
							type="text"
							readonly
							value="{targetParentCode} — {targetParentName}"
							class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 text-xs text-ink"
						/>
					</div>

					<div>
						<label for="sub-code" class="mb-1 block text-xs font-semibold"
							>Kode DDC Sub-divisi *</label
						>
						<input
							id="sub-code"
							name="code"
							type="text"
							required
							bind:value={newSubCode}
							placeholder="Contoh: 371 atau 297.6"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink uppercase focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div>
						<label for="sub-name" class="mb-1 block text-xs font-semibold"
							>Nama Sub-klasifikasi *</label
						>
						<input
							id="sub-name"
							name="name"
							type="text"
							required
							bind:value={newSubName}
							placeholder="Contoh: Manajemen Sekolah & Profesi Pendidik"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3">
						<button
							type="button"
							onclick={() => (isSubModalOpen = false)}
							class="rounded-md border border-ink/20 px-4 py-2 text-xs text-ink hover:bg-sand/60"
						>
							Batal
						</button>
						<button
							type="submit"
							class="rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream hover:bg-brick/90"
						>
							Simpan Sub-divisi
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- 3. Modal: Sunting Klasifikasi -->
	{#if isEditModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-class-title"
		>
			<div
				class="w-full max-w-md space-y-4 rounded-lg border border-ink/20 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)]"
			>
				<div class="flex items-center justify-between border-b border-ink/15 pb-2">
					<div class="flex items-center gap-2">
						<Pencil size={18} class="text-brick" />
						<h3 id="edit-class-title" class="font-serif text-base font-bold text-ink">
							Sunting Klasifikasi [{editCode}]
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (isEditModalOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						<X size={16} />
					</button>
				</div>

				<form
					method="POST"
					action="?/editClassification"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							isEditModalOpen = false;
						};
					}}
					class="space-y-4 text-xs sm:text-sm"
				>
					<input type="hidden" name="code" value={editCode} />

					<div>
						<label for="edit-name-inp" class="mb-1 block text-xs font-semibold"
							>Nama Klasifikasi *</label
						>
						<input
							id="edit-name-inp"
							name="name"
							type="text"
							required
							bind:value={editName}
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					{#if !isEditingSubclass}
						<div>
							<label for="edit-desc-inp" class="mb-1 block text-xs font-semibold"
								>Deskripsi Ruang Lingkup</label
							>
							<textarea
								id="edit-desc-inp"
								name="description"
								rows={2}
								bind:value={editDesc}
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							></textarea>
						</div>

						<div>
							<label for="edit-color-sel" class="mb-1 block text-xs font-semibold"
								>Palet Warna Label Rak</label
							>
							<select
								id="edit-color-sel"
								name="color"
								bind:value={editColor}
								class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							>
								<option value="brick">Bata (Brick - #9A3B3B)</option>
								<option value="terracotta">Terracotta (#C08261)</option>
								<option value="sand">Pasir (Sand - #E2C799)</option>
								<option value="ink">Tinta Gelap (Ink - #2A1A16)</option>
							</select>
						</div>
					{/if}

					<div class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3">
						<button
							type="button"
							onclick={() => (isEditModalOpen = false)}
							class="rounded-md border border-ink/20 px-4 py-2 text-xs text-ink hover:bg-sand/60"
						>
							Batal
						</button>
						<button
							type="submit"
							class="rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream hover:bg-brick/90"
						>
							Simpan Perubahan
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- 4. Modal: Hapus Klasifikasi -->
	{#if isDeleteModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="del-class-title"
		>
			<div
				class="w-full max-w-md space-y-4 rounded-lg border border-red-200 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)]"
			>
				<div class="flex items-center justify-between border-b border-ink/15 pb-2">
					<div class="flex items-center gap-2 text-red-700">
						<AlertCircle size={18} />
						<h3 id="del-class-title" class="font-serif text-base font-bold">
							Konfirmasi Hapus Klasifikasi
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (isDeleteModalOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						<X size={16} />
					</button>
				</div>

				<p class="text-xs leading-relaxed text-ink-muted">
					Apakah Anda yakin ingin menghapus klasifikasi <strong class="text-ink"
						>[{deleteTargetCode}] {deleteTargetName}</strong
					>? Klasifikasi hanya dapat dihapus jika sudah tidak ada koleksi buku yang terdaftar di
					dalamnya.
				</p>

				<form
					method="POST"
					action="?/deleteClassification"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							isDeleteModalOpen = false;
						};
					}}
					class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3"
				>
					<input type="hidden" name="code" value={deleteTargetCode} />

					<button
						type="button"
						onclick={() => (isDeleteModalOpen = false)}
						class="rounded-md border border-ink/20 px-4 py-2 text-xs text-ink hover:bg-sand/60"
					>
						Batal
					</button>
					<button
						type="submit"
						class="rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
					>
						Ya, Hapus Klasifikasi
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
