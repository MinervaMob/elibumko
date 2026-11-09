<script lang="ts">
	import {
		ArrowLeft,
		Download,
		RotateCw,
		Trash2,
		Database,
		CheckCircle2,
		AlertCircle,
		HardDrive,
		Sparkles
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { RecentActivityFeed, SearchLogsWidget } from '#lib';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');
	let isResetConfirmOpen = $state(false);

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toastMessage = msg;
		toastType = type;
		setTimeout(() => (toastMessage = null), 4000);
	}

	$effect(() => {
		if (form?.success && form.message) {
			showToast(form.message, 'success');
		} else if (form?.error) {
			showToast(form.error, 'error');
		}
	});

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}
</script>

<svelte:head>
	<title>Log Sirkulasi & Pencarian — Panel Pustakawan ElibUMKO</title>
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
				<h2 class="font-serif text-xl font-bold text-ink sm:text-2xl">Log Sirkulasi & Pencarian</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Audit trail kegiatan pustakawan, telemetri pencarian sivitas, dan manajemen penyimpanan
					ringan
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2.5">
			<span
				class="rounded-sm border border-terracotta/30 bg-terracotta/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-terracotta"
			>
				Audit Trail Real-time
			</span>

			<a
				href="/api/admin/export-logs"
				download
				class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-sand/40 px-3 py-1.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-sand/70"
			>
				<Download size={14} class="text-brick" />
				<span>Unduh Arsip Log (CSV)</span>
			</a>
		</div>
	</div>

	<!-- Storage Retention & Optimization Banner (Best Practice Industri) -->
	<div
		class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6"
	>
		<div
			class="flex flex-col justify-between gap-4 border-b border-ink/10 pb-4 sm:flex-row sm:items-center"
		>
			<div class="flex items-center gap-2.5">
				<div class="rounded-md bg-brick/10 p-2 text-brick">
					<HardDrive size={18} />
				</div>
				<div>
					<h3 class="font-serif text-base font-bold text-ink">
						Optimasi Penyimpanan & Retensi Log (Lightweight Engine)
					</h3>
					<p class="text-xs text-ink-muted">
						Arsitektur hemat disk untuk server lokal perpustakaan dengan pencegahan penumpukan data
						(*Anti-Bloat*)
					</p>
				</div>
			</div>

			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
			>
				<Sparkles size={13} />
				<span>Penyimpanan Optimal ({formatBytes(data.logStats.estimatedSizeBytes)})</span>
			</span>
		</div>

		<!-- Metrics Grid -->
		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div class="rounded-md border border-ink/10 bg-white/60 p-3.5">
				<span class="block text-[11px] font-medium tracking-wider text-ink-muted uppercase">
					Kapasitas Audit Trail (FIFO)
				</span>
				<div class="mt-1 flex items-baseline gap-2">
					<span class="font-mono text-xl font-bold text-ink">
						{data.logStats.activityLogCount}
					</span>
					<span class="font-mono text-xs text-ink-muted">
						/ {data.logStats.maxActivityLogs} maks entri
					</span>
				</div>
				<p class="mt-1 text-[11px] text-ink-muted">
					Otomatis memangkas catatan tertua saat batas tercapai.
				</p>
			</div>

			<div class="rounded-md border border-ink/10 bg-white/60 p-3.5">
				<span class="block text-[11px] font-medium tracking-wider text-ink-muted uppercase">
					Agregasi Log Pencarian
				</span>
				<div class="mt-1 flex items-baseline gap-2">
					<span class="font-mono text-xl font-bold text-ink">
						{data.logStats.popularSearchCount + data.logStats.zeroSearchCount}
					</span>
					<span class="text-xs text-ink-muted">
						query unik ({data.logStats.zeroSearchCount} tanpa hasil)
					</span>
				</div>
				<p class="mt-1 text-[11px] text-ink-muted">
					Pencarian berulang diagregasi (upsert count), tidak membuat baris baru.
				</p>
			</div>

			<div class="rounded-md border border-ink/10 bg-white/60 p-3.5">
				<span class="block text-[11px] font-medium tracking-wider text-ink-muted uppercase">
					Kebijakan Retensi Aktif
				</span>
				<div class="mt-1 flex items-baseline gap-1">
					<span class="font-mono text-sm font-bold text-brick"> Circular Buffer </span>
				</div>
				<p class="mt-1 text-[11px] text-ink-muted">
					Server bebas risiko kehabisan ruang disk (*zero disk-full risk*).
				</p>
			</div>
		</div>

		<!-- Action Operations -->
		<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
			<p class="text-xs text-ink-muted">
				Tindakan pemeliharaan manual dapat dilakukan kapan saja untuk membersihkan riwayat:
			</p>

			<div class="flex flex-wrap items-center gap-2">
				<!-- Prune Old Logs -->
				<form method="POST" action="?/rotateLogs" use:enhance>
					<button
						type="submit"
						class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/40"
						title="Pangkas catatan log lama dan pertahankan 200 riwayat terkini"
					>
						<RotateCw size={13} class="text-brick" />
						<span>Rotasi & Pangkas Log Lama</span>
					</button>
				</form>

				<!-- Clear Zero Searches -->
				{#if data.logStats.zeroSearchCount > 0}
					<form method="POST" action="?/clearZeroSearches" use:enhance>
						<button
							type="submit"
							class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/40"
							title="Bersihkan riwayat pencarian tanpa hasil"
						>
							<Trash2 size={13} class="text-terracotta" />
							<span>Bersihkan Pencarian Nihil ({data.logStats.zeroSearchCount})</span>
						</button>
					</form>
				{/if}

				<!-- Reset All Searches -->
				<button
					type="button"
					onclick={() => (isResetConfirmOpen = true)}
					class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-red-50 hover:text-red-700"
					title="Reset seluruh riwayat pencarian sivitas"
				>
					<Database size={13} />
					<span>Reset Pencarian</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Widgets Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<SearchLogsWidget
			popularQueries={data.popularQueries}
			zeroResultQueries={data.zeroResultQueries}
		/>
		<RecentActivityFeed activities={data.activities} showViewAll={false} />
	</div>

	<!-- Modal Konfirmasi Reset Pencarian -->
	{#if isResetConfirmOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
			role="dialog"
			aria-modal="true"
			aria-labelledby="reset-title"
		>
			<div
				class="w-full max-w-md space-y-4 rounded-lg border border-ink/20 bg-cream p-6 text-ink shadow-[0_16px_48px_rgba(42,26,22,0.25)]"
			>
				<div class="flex items-center justify-between border-b border-ink/15 pb-2">
					<div class="flex items-center gap-2 text-brick">
						<AlertCircle size={18} />
						<h3 id="reset-title" class="font-serif text-base font-bold text-ink">
							Konfirmasi Reset Riwayat Pencarian
						</h3>
					</div>
					<button
						type="button"
						onclick={() => (isResetConfirmOpen = false)}
						class="rounded p-1 text-ink-muted hover:text-ink"
					>
						✕
					</button>
				</div>

				<p class="text-xs leading-relaxed text-ink-muted">
					Apakah Anda yakin ingin mengosongkan seluruh riwayat kata kunci pencarian sivitas
					akademika? Statistik kata kunci populer dan nihil akan dihitung ulang dari awal. Tindakan
					ini tidak dapat dibatalkan.
				</p>

				<form
					method="POST"
					action="?/clearAllSearches"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							isResetConfirmOpen = false;
						};
					}}
					class="flex items-center justify-end gap-2.5 border-t border-ink/15 pt-3"
				>
					<button
						type="button"
						onclick={() => (isResetConfirmOpen = false)}
						class="rounded-md border border-ink/20 px-4 py-2 text-xs text-ink hover:bg-sand/60"
					>
						Batal
					</button>
					<button
						type="submit"
						class="rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream hover:bg-brick/90"
					>
						Ya, Reset Riwayat Pencarian
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
