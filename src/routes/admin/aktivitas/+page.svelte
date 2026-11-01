<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { RecentActivityFeed, SearchLogsWidget } from '#lib';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Log & Aktivitas — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4 border-b border-ink/15 pb-4">
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
					Audit trail kegiatan pustakawan, pencarian mahasiswa, dan performa koleksi
				</p>
			</div>
		</div>

		<span
			class="rounded-sm border border-terracotta/30 bg-terracotta/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-terracotta"
		>
			Audit Trail Real-time
		</span>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<SearchLogsWidget
			popularQueries={data.popularQueries}
			zeroResultQueries={data.zeroResultQueries}
		/>
		<RecentActivityFeed activities={data.activities} />
	</div>
</div>
