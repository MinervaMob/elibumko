<script lang="ts">
	import { page } from '$app/state';
	import { Menu, Plus, HardDrive } from 'lucide-svelte';

	interface Stats {
		storageUsedGB: number;
		storageLimitGB: number;
		storagePercent: number;
	}

	interface Props {
		title?: string;
		subtitle?: string;
		stats?: Stats;
		onToggleSidebar?: () => void;
	}

	let {
		title = 'Ringkasan Sistem Perpustakaan',
		subtitle = 'Pantau koleksi, pembaca aktif, dan riwayat sirkulasi digital',
		stats: customStats,
		onToggleSidebar
	}: Props = $props();

	const stats = $derived<Stats>(
		customStats ??
			page.data?.stats ?? {
				storageUsedGB: 0,
				storageLimitGB: 50,
				storagePercent: 0
			}
	);

	// Indonesian formatted current date
	const todayDate = new Intl.DateTimeFormat('id-ID', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(new Date());
</script>

<header
	class="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink/15 bg-cream/95 px-4 py-3.5 backdrop-blur-xs transition-colors sm:px-6"
>
	<!-- Left: Mobile Menu + Titles -->
	<div class="flex min-w-0 items-center gap-3">
		<button
			type="button"
			class="focus-library rounded-sm border border-ink/15 p-2 text-ink hover:bg-sand/60 lg:hidden"
			onclick={onToggleSidebar}
			aria-label="Buka menu navigasi"
		>
			<Menu size={18} />
		</button>

		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<h1 class="truncate font-serif text-base leading-tight font-bold text-ink sm:text-lg">
					{title}
				</h1>
			</div>
			<p class="hidden truncate font-sans text-xs text-ink-muted sm:block">
				{subtitle}
			</p>
		</div>
	</div>

	<!-- Right: Date, Storage Status, Quick Actions -->
	<div class="flex shrink-0 items-center gap-2 sm:gap-3">
		<!-- Date Badge (Desktop) -->
		<div
			class="hidden items-center gap-1.5 rounded-sm border border-ink/10 bg-sand/30 px-3 py-1.5 text-xs text-ink-muted xl:flex"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-brick"></span>
			<span>{todayDate}</span>
		</div>

		<!-- Storage Status Pill -->
		<div
			class="hidden items-center gap-2 rounded-sm border border-ink/15 bg-sand/40 px-3 py-1.5 font-mono text-xs text-ink md:flex"
			title="Penyimpanan Berkas Digital Lokal"
		>
			<HardDrive size={14} class="text-brick" />
			<span>
				{stats.storageUsedGB} GB
				<span class="text-ink-muted">/ {stats.storageLimitGB} GB</span>
			</span>
			<span class="py-0.2 rounded-xs bg-brick/15 px-1.5 text-[10px] font-bold text-brick">
				{stats.storagePercent}%
			</span>
		</div>

		<!-- Add Book CTA -->
		<a
			href="/admin/buku?action=tambah"
			class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-3 py-1.5 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 sm:px-3.5 sm:text-sm"
		>
			<Plus size={16} />
			<span>Tambah Buku</span>
		</a>
	</div>
</header>
