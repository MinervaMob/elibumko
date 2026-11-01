<script lang="ts">
	/**
	 * /admin/kategori — Modul CMS Klasifikasi DDC & Kategori
	 *
	 * Fitur:
	 * - Mengelola 10 divisi utama Dewey Decimal Classification (DDC)
	 * - Tambah & sunting sub-kelas klasifikasi rak digital
	 * - Pemetaan warna punggung buku (spine palette)
	 */

	import { FolderTree, Plus, ArrowLeft, CheckCircle2, X, BookOpen } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { ClassificationNode } from '#lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// svelte-ignore state_referenced_locally
	let ddcTree = $state<ClassificationNode[]>([...data.ddcTree]);
	let isModalOpen = $state(false);
	let targetParentCode = $state('000');
	let newSubCode = $state('');
	let newSubName = $state('');
	let toastMessage = $state<string | null>(null);

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => (toastMessage = null), 3500);
	}

	function openAddSubModal(parentCode: string) {
		targetParentCode = parentCode;
		newSubCode = parentCode.slice(0, 1) + '10';
		newSubName = '';
		isModalOpen = true;
	}

	function handleAddSubclass(e: SubmitEvent) {
		e.preventDefault();
		if (!newSubCode.trim() || !newSubName.trim()) return;

		const parent = ddcTree.find((d) => d.code === targetParentCode);
		if (parent) {
			if (!parent.subclasses) parent.subclasses = [];
			parent.subclasses.push({
				code: newSubCode.trim(),
				name: newSubName.trim(),
				count: 0
			});
			showToast(`Sub-klasifikasi DDC ${newSubCode} "${newSubName}" berhasil ditambahkan.`);
		}
		isModalOpen = false;
	}
</script>

<svelte:head>
	<title>Struktur Klasifikasi DDC — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="space-y-6">
	<!-- Toast Notification -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
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
					Struktur Klasifikasi DDC
				</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Dewey Decimal Classification untuk penataan dan penjelajahan rak buku digital kampus
				</p>
			</div>
		</div>

		<span
			class="rounded-sm border border-ink/15 bg-sand/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-ink"
		>
			10 Divisi Utama Aktif
		</span>
	</div>

	<!-- DDC Class Cards Grid -->
	<div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
		{#each ddcTree as node (node.code)}
			<div
				class="catalog-card flex flex-col justify-between rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6"
			>
				<div>
					<!-- Class Header -->
					<div class="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
						<div class="flex items-center gap-2.5">
							<span
								class="rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-sm font-bold text-brick"
							>
								{node.code}
							</span>
							<h3 class="font-serif text-base font-bold text-ink">
								{node.name}
							</h3>
						</div>
						<span class="shrink-0 font-mono text-xs font-semibold text-ink-muted">
							{node.count} judul
						</span>
					</div>

					<!-- Subclasses list -->
					<div class="mt-3.5 space-y-2">
						{#if node.subclasses?.length}
							<ul class="space-y-1.5 border-l-2 border-brick/30 pl-2 text-xs">
								{#each node.subclasses as sub (sub.code)}
									<li
										class="flex items-center justify-between gap-2 py-0.5 text-ink-muted hover:text-ink"
									>
										<div class="flex min-w-0 items-center gap-1.5">
											<strong class="shrink-0 font-mono text-brick">{sub.code}</strong>
											<span class="truncate">{sub.name}</span>
										</div>
										<span class="shrink-0 font-mono text-[11px] text-ink-muted/80">
											{sub.count} naskah
										</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="py-1 text-xs text-ink-muted italic">Belum ada sub-divisi terdaftar.</p>
						{/if}
					</div>
				</div>

				<!-- Add Subclass Button -->
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
						onclick={() => openAddSubModal(node.code)}
						class="focus-library flex items-center gap-1 rounded p-1 text-xs font-semibold text-brick hover:underline"
					>
						<Plus size={13} />
						<span>Tambah Sub-divisi</span>
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Add Subclass Modal -->
	{#if isModalOpen}
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
						onclick={() => (isModalOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						<X size={16} />
					</button>
				</div>

				<form onsubmit={handleAddSubclass} class="space-y-4 text-xs sm:text-sm">
					<div>
						<label for="parent-code-view" class="mb-1 block font-semibold">Divisi Utama</label>
						<input
							id="parent-code-view"
							type="text"
							readonly
							value="{targetParentCode} — {ddcTree.find((d) => d.code === targetParentCode)?.name}"
							class="w-full rounded-sm border border-ink/15 bg-sand/40 px-3 py-2 text-xs text-ink"
						/>
					</div>

					<div>
						<label for="sub-code" class="mb-1 block font-semibold">Kode DDC Sub-divisi</label>
						<input
							id="sub-code"
							type="text"
							required
							bind:value={newSubCode}
							placeholder="Contoh: 371 atau 297.6"
							class="w-full rounded-sm border border-ink/20 bg-white px-3 py-2 font-mono text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
						/>
					</div>

					<div>
						<label for="sub-name" class="mb-1 block font-semibold">Nama Sub-klasifikasi</label>
						<input
							id="sub-name"
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
							onclick={() => (isModalOpen = false)}
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
</div>
