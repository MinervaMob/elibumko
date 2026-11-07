<script lang="ts">
	import { page } from '$app/state';
	import { HardDrive, FileText, Book, CheckCircle2 } from 'lucide-svelte';

	interface Stats {
		totalBooks: number;
		totalPdfBooks: number;
		totalEpubBooks: number;
		storageUsedGB: number;
		storageLimitGB: number;
		storagePercent: number;
	}

	interface Props {
		stats?: Stats;
		class?: string;
	}

	let { stats: customStats, class: className = '' }: Props = $props();

	const stats = $derived<Stats>(
		customStats ??
			page.data?.stats ?? {
				totalBooks: 0,
				totalPdfBooks: 0,
				totalEpubBooks: 0,
				storageUsedGB: 0,
				storageLimitGB: 50,
				storagePercent: 0
			}
	);

	const pdfPercent = $derived(
		stats.totalBooks > 0 ? Math.round((stats.totalPdfBooks / stats.totalBooks) * 100) : 100
	);
	const epubPercent = $derived(100 - pdfPercent);
	const pdfRatio = $derived(stats.totalBooks > 0 ? stats.totalPdfBooks / stats.totalBooks : 1);
	const epubRatio = $derived(1 - pdfRatio);
	const remainingGB = $derived(Math.max(0, stats.storageLimitGB - stats.storageUsedGB).toFixed(1));
</script>

<div
	class="catalog-card flex flex-col justify-between rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6 {className}"
>
	<div>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-ink/15 pb-3">
			<div class="flex items-center gap-2">
				<HardDrive size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink sm:text-lg">
					Kapasitas Storage Terproteksi
				</h3>
			</div>
			<span
				class="flex items-center gap-1 rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brick"
			>
				<CheckCircle2 size={12} />
				<span>Normal</span>
			</span>
		</div>

		<!-- Big numbers -->
		<div class="mt-4 flex items-baseline justify-between">
			<div>
				<span class="font-mono text-3xl font-bold text-ink">
					{stats.storageUsedGB}
				</span>
				<span class="ml-1 font-mono text-xs text-ink-muted">GB terpakai</span>
			</div>
			<span class="font-mono text-xs text-ink-muted">
				Batas: {stats.storageLimitGB} GB ({stats.storagePercent}%)
			</span>
		</div>

		<!-- Progress Bar -->
		<div
			class="mt-3 flex h-3 w-full overflow-hidden rounded-full border border-ink/15 bg-sand/80 p-0.5"
		>
			<!-- PDF portion -->
			<div
				class="h-full rounded-l-full bg-brick transition-all duration-500"
				style="width: {stats.storagePercent * pdfRatio}%"
				title="Naskah PDF: {(stats.storageUsedGB * pdfRatio).toFixed(1)} GB"
			></div>
			<!-- EPUB portion -->
			<div
				class="h-full bg-terracotta transition-all duration-500"
				style="width: {stats.storagePercent * epubRatio}%"
				title="Ebook EPUB: {(stats.storageUsedGB * epubRatio).toFixed(1)} GB"
			></div>
		</div>

		<!-- Legend -->
		<div class="mt-4 grid grid-cols-2 gap-3 text-xs">
			<div class="flex items-start gap-2 rounded-sm border border-ink/10 bg-sand/40 p-2.5">
				<div class="mt-0.5 shrink-0 rounded bg-brick/15 p-1 text-brick">
					<FileText size={13} />
				</div>
				<div>
					<p class="font-semibold text-ink">PDF ({stats.totalPdfBooks})</p>
					<p class="font-mono text-[11px] text-ink-muted">{pdfPercent}% volume</p>
				</div>
			</div>

			<div class="flex items-start gap-2 rounded-sm border border-ink/10 bg-sand/40 p-2.5">
				<div class="mt-0.5 shrink-0 rounded bg-terracotta/20 p-1 text-terracotta">
					<Book size={13} />
				</div>
				<div>
					<p class="font-semibold text-ink">EPUB ({stats.totalEpubBooks})</p>
					<p class="font-mono text-[11px] text-ink-muted">{epubPercent}% volume</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Storage notice footer -->
	<div
		class="mt-4 flex items-center justify-between border-t border-ink/10 pt-3 text-xs text-ink-muted"
	>
		<span class="font-mono">Sisa ruang: {remainingGB} GB</span>
		<a
			href="/admin/pengaturan"
			class="focus-library rounded text-xs font-medium text-brick hover:underline"
		>
			Kelola Kuota Storage →
		</a>
	</div>
</div>
