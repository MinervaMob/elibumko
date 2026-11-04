<script lang="ts">
	import { X, Palette, Columns, Rows } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		fileType?: 'pdf' | 'epub' | 'docx';
		theme: 'light' | 'sepia' | 'dark' | 'contrast';
		readMode: 'paged' | 'scroll';
		twoPageSpread: boolean;
		fontFamily: string;
		fontSize: number;
		lineHeight: number;
		onClose: () => void;
		onThemeChange: (theme: 'light' | 'sepia' | 'dark' | 'contrast') => void;
		onReadModeChange: (mode: 'paged' | 'scroll') => void;
		onTwoPageSpreadChange: (spread: boolean) => void;
		onFontFamilyChange: (font: string) => void;
		onFontSizeChange: (size: number) => void;
		onLineHeightChange: (lh: number) => void;
	}

	let {
		isOpen,
		fileType: _fileType = 'pdf',
		theme,
		readMode,
		twoPageSpread,
		fontFamily,
		fontSize,
		lineHeight,
		onClose,
		onThemeChange,
		onReadModeChange,
		onTwoPageSpreadChange,
		onFontFamilyChange,
		onFontSizeChange,
		onLineHeightChange
	}: Props = $props();
</script>

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-xs"
		tabindex="-1"
		onclick={onClose}
		aria-label="Tutup panel pengaturan tampilan"
	></button>

	<!-- Slide-out Drawer Panel -->
	<aside
		class="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-85 flex-col overflow-y-auto border-l border-ink/20 bg-cream p-5 text-ink shadow-[0_0_32px_rgba(42,26,22,0.2)]"
		aria-label="Pengaturan Tampilan Baca"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-ink/15 pb-3">
			<div class="flex items-center gap-2">
				<Palette size={18} class="text-brick" />
				<h3 class="font-serif text-lg font-bold text-ink">Pengaturan Tampilan</h3>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="focus-library rounded-sm p-1.5 text-ink-muted hover:bg-sand/60 hover:text-ink"
				aria-label="Tutup"
			>
				<X size={18} />
			</button>
		</div>

		<div class="flex-1 space-y-6 py-4 text-xs sm:text-sm">
			<!-- 1. Tema Warna Baca (Palette-strict) -->
			<div>
				<span
					class="mb-2.5 block font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase"
				>
					Tema Kertas Bacaan
				</span>
				<div class="grid grid-cols-2 gap-2">
					<!-- Light / Cream -->
					<button
						type="button"
						onclick={() => onThemeChange('light')}
						class="focus-library flex items-center gap-2 rounded-md border p-2.5 text-left transition-all {theme ===
						'light'
							? 'border-brick bg-[#F2ECBE] text-[#2A1A16] ring-2 ring-brick/30'
							: 'border-ink/20 bg-[#F2ECBE] text-[#2A1A16] hover:border-ink/40'}"
					>
						<span class="h-4 w-4 shrink-0 rounded-full border border-ink/30 bg-[#F2ECBE]"></span>
						<span class="text-xs font-medium">Terang (Cream)</span>
					</button>

					<!-- Sepia / Sand -->
					<button
						type="button"
						onclick={() => onThemeChange('sepia')}
						class="focus-library flex items-center gap-2 rounded-md border p-2.5 text-left transition-all {theme ===
						'sepia'
							? 'border-brick bg-[#E2C799] text-[#433422] ring-2 ring-brick/30'
							: 'border-ink/20 bg-[#E2C799] text-[#433422] hover:border-ink/40'}"
					>
						<span class="h-4 w-4 shrink-0 rounded-full border border-ink/30 bg-[#E2C799]"></span>
						<span class="text-xs font-medium">Sepia (Sand)</span>
					</button>

					<!-- Dark Mode -->
					<button
						type="button"
						onclick={() => onThemeChange('dark')}
						class="focus-library flex items-center gap-2 rounded-md border p-2.5 text-left transition-all {theme ===
						'dark'
							? 'border-brick bg-[#1C1210] text-[#F2ECBE] ring-2 ring-brick/30'
							: 'border-ink/20 bg-[#1C1210] text-[#F2ECBE] hover:border-ink/40'}"
					>
						<span class="h-4 w-4 shrink-0 rounded-full border border-white/30 bg-[#1C1210]"></span>
						<span class="text-xs font-medium">Gelap (Malam)</span>
					</button>

					<!-- High Contrast -->
					<button
						type="button"
						onclick={() => onThemeChange('contrast')}
						class="focus-library flex items-center gap-2 rounded-md border p-2.5 text-left transition-all {theme ===
						'contrast'
							? 'border-brick bg-black text-white ring-2 ring-brick/30'
							: 'border-ink/20 bg-black text-white hover:border-ink/40'}"
					>
						<span class="h-4 w-4 shrink-0 rounded-full border border-white bg-black"></span>
						<span class="text-xs font-medium">Kontras Tinggi</span>
					</button>
				</div>
			</div>

			<!-- 2. Mode Baca (Paged vs Continuous Scroll) -->
			<div>
				<span
					class="mb-2.5 block font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase"
				>
					Navigasi Halaman
				</span>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => onReadModeChange('paged')}
						class="focus-library flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-all {readMode ===
						'paged'
							? 'border-brick bg-brick text-cream shadow-xs'
							: 'border-ink/20 bg-sand/30 text-ink hover:bg-sand/60'}"
					>
						<Columns size={15} />
						<span>Geser (Paged)</span>
					</button>

					<button
						type="button"
						onclick={() => onReadModeChange('scroll')}
						class="focus-library flex items-center justify-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-all {readMode ===
						'scroll'
							? 'border-brick bg-brick text-cream shadow-xs'
							: 'border-ink/20 bg-sand/30 text-ink hover:bg-sand/60'}"
					>
						<Rows size={15} />
						<span>Gulir (Scroll)</span>
					</button>
				</div>

				{#if readMode === 'paged'}
					<label class="mt-3 flex cursor-pointer items-center gap-2 text-xs select-none">
						<input
							type="checkbox"
							checked={twoPageSpread}
							onchange={(e) => onTwoPageSpreadChange(e.currentTarget.checked)}
							class="rounded border-ink/30 text-brick focus:ring-brick"
						/>
						<span>Tampilkan 2 halaman berdampingan (Layar Lebar)</span>
					</label>
				{/if}
			</div>

			<!-- 3. Typography & Font Selection (Aktif untuk EPUB / Reading view) -->
			<div class="border-t border-ink/15 pt-4">
				<span
					class="mb-2.5 block font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase"
				>
					Jenis Font Teks
				</span>
				<div class="space-y-1.5">
					<button
						type="button"
						onclick={() => onFontFamilyChange('Literata')}
						class="focus-library flex w-full items-center justify-between rounded-sm border p-2 text-left text-xs transition-colors {fontFamily ===
						'Literata'
							? 'border-brick bg-brick text-cream'
							: 'border-ink/15 bg-white/70 text-ink hover:bg-sand/50'}"
					>
						<span class="font-reader text-sm font-medium">Literata (Buku Standar)</span>
						<span class="font-mono text-[10px] opacity-80">Serif</span>
					</button>

					<button
						type="button"
						onclick={() => onFontFamilyChange('Source Sans 3')}
						class="focus-library flex w-full items-center justify-between rounded-sm border p-2 text-left text-xs transition-colors {fontFamily ===
						'Source Sans 3'
							? 'border-brick bg-brick text-cream'
							: 'border-ink/15 bg-white/70 text-ink hover:bg-sand/50'}"
					>
						<span class="font-sans text-sm font-medium">Source Sans 3 (Modern)</span>
						<span class="font-mono text-[10px] opacity-80">Sans-Serif</span>
					</button>

					<button
						type="button"
						onclick={() => onFontFamilyChange('Atkinson Hyperlegible')}
						class="focus-library flex w-full items-center justify-between rounded-sm border p-2 text-left text-xs transition-colors {fontFamily ===
						'Atkinson Hyperlegible'
							? 'border-brick bg-brick text-cream'
							: 'border-ink/15 bg-white/70 text-ink hover:bg-sand/50'}"
					>
						<span class="font-sans text-sm font-medium">Atkinson (Ramah Disleksia)</span>
						<span class="font-mono text-[10px] opacity-80">Aksesibel</span>
					</button>
				</div>
			</div>

			<!-- 4. Ukuran Font & Spasi Baris -->
			<div class="space-y-4 pt-2">
				<div>
					<div class="mb-1.5 flex items-center justify-between text-xs">
						<span class="text-ink-muted">Ukuran Teks:</span>
						<span class="font-mono font-bold text-brick">{fontSize}px</span>
					</div>
					<input
						type="range"
						min="14"
						max="26"
						step="1"
						value={fontSize}
						oninput={(e) => onFontSizeChange(Number(e.currentTarget.value))}
						class="w-full cursor-pointer accent-brick"
					/>
				</div>

				<div>
					<div class="mb-1.5 flex items-center justify-between text-xs">
						<span class="text-ink-muted">Tinggi Baris (Line Height):</span>
						<span class="font-mono font-bold text-brick">{lineHeight}</span>
					</div>
					<input
						type="range"
						min="1.4"
						max="2.2"
						step="0.1"
						value={lineHeight}
						oninput={(e) => onLineHeightChange(Number(e.currentTarget.value))}
						class="w-full cursor-pointer accent-brick"
					/>
				</div>
			</div>
		</div>

		<!-- Footer notice -->
		<div class="border-t border-ink/15 pt-4 text-[11px] text-ink-muted">
			<p>Preferensi bacaan Anda disimpan secara otomatis di peramban ini.</p>
		</div>
	</aside>
{/if}
