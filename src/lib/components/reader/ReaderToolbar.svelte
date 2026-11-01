<script lang="ts">
	import {
		ArrowLeft,
		Search,
		Settings,
		ZoomIn,
		ZoomOut,
		Maximize,
		Minimize,
		ListFilter,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';

	interface Props {
		title: string;
		author?: string;
		currentPage?: number;
		totalPages?: number;
		zoom?: number;
		isFullscreen?: boolean;
		isTocOpen?: boolean;
		isSearchOpen?: boolean;
		isSettingsOpen?: boolean;
		onBack?: () => void;
		onPrevPage?: () => void;
		onNextPage?: () => void;
		onZoomIn?: () => void;
		onZoomOut?: () => void;
		onToggleToc?: () => void;
		onToggleSearch?: () => void;
		onToggleSettings?: () => void;
		onToggleFullscreen?: () => void;
		class?: string;
	}

	let {
		title,
		author = 'Universitas Muhammadiyah Kotabumi',
		currentPage = 12,
		totalPages = 248,
		zoom = 100,
		isFullscreen = false,
		isTocOpen = false,
		isSearchOpen = false,
		isSettingsOpen = false,
		onBack,
		onPrevPage,
		onNextPage,
		onZoomIn,
		onZoomOut,
		onToggleToc,
		onToggleSearch,
		onToggleSettings,
		onToggleFullscreen,
		class: className = ''
	}: Props = $props();
</script>

<header
	class="z-30 flex w-full items-center justify-between gap-3 border-b border-ink/15 bg-cream px-3 py-2 text-ink shadow-[0_2px_8px_rgba(42,26,22,0.06)] transition-colors select-none sm:px-4 {className}"
>
	<!-- Left section: Back button + Book title -->
	<div class="flex min-w-0 items-center gap-2 sm:gap-3">
		<button
			type="button"
			onclick={onBack}
			class="focus-library rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand/70 hover:text-ink sm:p-2"
			aria-label="Kembali ke halaman detail buku"
			title="Kembali"
		>
			<ArrowLeft size={18} />
		</button>

		<button
			type="button"
			onclick={onToggleToc}
			class="focus-library rounded-sm border border-ink/15 p-1.5 transition-colors hover:bg-sand/70 sm:p-2 {isTocOpen
				? 'border-brick bg-brick text-cream'
				: 'text-ink-muted hover:text-ink'}"
			aria-label="Buka Daftar Isi"
			title="Daftar Isi"
		>
			<ListFilter size={18} />
		</button>

		<div class="hidden min-w-0 md:block">
			<h2 class="truncate font-serif text-sm leading-tight font-bold text-ink sm:text-base">
				{title}
			</h2>
			<p class="truncate font-sans text-xs text-ink-muted">
				{author}
			</p>
		</div>
	</div>

	<!-- Center section: Page navigation & jump -->
	<div class="flex items-center gap-1.5 sm:gap-2">
		<button
			type="button"
			onclick={onPrevPage}
			disabled={currentPage <= 1}
			class="focus-library rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand/70 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
			aria-label="Halaman Sebelumnya"
		>
			<ChevronLeft size={18} />
		</button>

		<div
			class="flex items-center gap-1 rounded-sm border border-ink/15 bg-white/70 px-2.5 py-1 font-mono text-xs"
		>
			<span class="text-ink-muted">Halaman</span>
			<input
				type="number"
				min="1"
				max={totalPages}
				value={currentPage}
				class="w-10 rounded-xs border-0 bg-transparent p-0 text-center font-bold text-ink focus:ring-1 focus:ring-brick"
				aria-label="Nomor halaman saat ini"
			/>
			<span class="text-ink-muted">/ {totalPages}</span>
		</div>

		<button
			type="button"
			onclick={onNextPage}
			disabled={currentPage >= totalPages}
			class="focus-library rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand/70 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
			aria-label="Halaman Berikutnya"
		>
			<ChevronRight size={18} />
		</button>
	</div>

	<!-- Right section: Zoom, Search, Settings, Fullscreen -->
	<div class="flex items-center gap-1 sm:gap-1.5">
		<!-- Zoom controls -->
		<div
			class="hidden items-center rounded-sm border border-ink/15 bg-white/70 px-1 py-0.5 lg:flex"
		>
			<button
				type="button"
				onclick={onZoomOut}
				class="focus-library rounded-xs p-1 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				aria-label="Perkecil"
				title="Perkecil"
			>
				<ZoomOut size={15} />
			</button>
			<span class="min-w-10.5 px-1.5 text-center font-mono text-xs font-medium">
				{zoom}%
			</span>
			<button
				type="button"
				onclick={onZoomIn}
				class="focus-library rounded-xs p-1 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				aria-label="Perbesar"
				title="Perbesar"
			>
				<ZoomIn size={15} />
			</button>
		</div>

		<!-- Search within document -->
		<button
			type="button"
			onclick={onToggleSearch}
			class="focus-library rounded-sm border border-ink/15 p-1.5 transition-colors hover:bg-sand/70 sm:p-2 {isSearchOpen
				? 'border-brick bg-brick text-cream'
				: 'text-ink-muted hover:text-ink'}"
			aria-label="Cari kata dalam buku"
			title="Cari kata (Ctrl+F)"
		>
			<Search size={18} />
		</button>

		<!-- Reader display settings (theme, font, mode) -->
		<button
			type="button"
			onclick={onToggleSettings}
			class="focus-library rounded-sm border border-ink/15 p-1.5 transition-colors hover:bg-sand/70 sm:p-2 {isSettingsOpen
				? 'border-brick bg-brick text-cream'
				: 'text-ink-muted hover:text-ink'}"
			aria-label="Pengaturan Tampilan Baca"
			title="Pengaturan Tampilan"
		>
			<Settings size={18} />
		</button>

		<!-- Fullscreen toggle -->
		<button
			type="button"
			onclick={onToggleFullscreen}
			class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:bg-sand/70 hover:text-ink sm:p-2"
			aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
			title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
		>
			{#if isFullscreen}
				<Minimize size={18} />
			{:else}
				<Maximize size={18} />
			{/if}
		</button>
	</div>
</header>
