<script lang="ts">
	import { TrendingUp, Users, BookOpen } from 'lucide-svelte';
	import type { ReadingTrendPoint } from '#lib/types';

	interface Props {
		data: ReadingTrendPoint[];
		class?: string;
	}

	let { data, class: className = '' }: Props = $props();

	type Metric = 'sessions' | 'pages';
	let selectedMetric = $state<Metric>('sessions');
	let hoveredIndex = $state<number | null>(null);

	const maxSessions = $derived(Math.max(...data.map((d) => d.sessions), 100));
	const maxPages = $derived(Math.max(...data.map((d) => d.pagesRead), 1000));
	const activeMax = $derived(selectedMetric === 'sessions' ? maxSessions : maxPages);

	// SVG Dimensions
	const width = 640;
	const height = 220;
	const padLeft = 45;
	const padRight = 20;
	const padTop = 20;
	const padBottom = 35;

	const plotWidth = width - padLeft - padRight;
	const plotHeight = height - padTop - padBottom;

	// Computed points
	const points = $derived(
		data.map((item, i) => {
			const x = padLeft + (i / Math.max(1, data.length - 1)) * plotWidth;
			const val = selectedMetric === 'sessions' ? item.sessions : item.pagesRead;
			const y = padTop + plotHeight - (val / activeMax) * plotHeight;
			return { x, y, val, label: item.label, item };
		})
	);

	// Generate smooth SVG path
	const pathString = $derived(
		points.reduce((acc, p, i) => {
			if (i === 0) return `M ${p.x} ${p.y}`;
			const prev = points[i - 1];
			const cx1 = prev.x + (p.x - prev.x) / 2;
			const cy1 = prev.y;
			const cx2 = prev.x + (p.x - prev.x) / 2;
			const cy2 = p.y;
			return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
		}, '')
	);

	// Area under the curve
	const areaString = $derived(
		points.length > 0
			? `${pathString} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
			: ''
	);

	// Grid steps
	const gridSteps = 4;
	const yLabels = $derived(
		Array.from({ length: gridSteps + 1 }, (_, i) => {
			const ratio = i / gridSteps;
			const val = Math.round(ratio * activeMax);
			const y = padTop + plotHeight - ratio * plotHeight;
			return { y, val };
		})
	);
</script>

<div
	class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6 {className}"
>
	<!-- Card Header & Switcher -->
	<div
		class="flex flex-col items-start justify-between gap-3 border-b border-ink/15 pb-4 sm:flex-row sm:items-center"
	>
		<div>
			<div class="flex items-center gap-2">
				<TrendingUp size={18} class="text-brick" />
				<h3 class="font-serif text-base font-bold text-ink sm:text-lg">
					Aktivitas Pembacaan Mingguan
				</h3>
			</div>
			<p class="mt-0.5 text-xs text-ink-muted">
				Tren pembacaan ebook oleh mahasiswa dan dosen (7 hari terakhir)
			</p>
		</div>

		<!-- Metric Toggle -->
		<div
			class="flex items-center justify-center self-stretch rounded-md border border-ink/15 bg-sand/50 p-1 sm:self-auto"
		>
			<button
				type="button"
				class="focus-library flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-all {selectedMetric ===
				'sessions'
					? 'bg-brick font-semibold text-cream shadow-xs'
					: 'text-ink-muted hover:text-ink'}"
				onclick={() => (selectedMetric = 'sessions')}
			>
				<Users size={13} />
				<span>Sesi Baca</span>
			</button>
			<button
				type="button"
				class="focus-library flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-all {selectedMetric ===
				'pages'
					? 'bg-brick font-semibold text-cream shadow-xs'
					: 'text-ink-muted hover:text-ink'}"
				onclick={() => (selectedMetric = 'pages')}
			>
				<BookOpen size={13} />
				<span>Halaman</span>
			</button>
		</div>
	</div>

	<!-- SVG Chart Canvas -->
	<div class="relative mt-4 w-full overflow-hidden">
		<svg
			viewBox="0 0 {width} {height}"
			class="h-auto w-full overflow-visible select-none"
			aria-label="Grafik tren pembacaan mingguan"
		>
			<defs>
				<!-- Gradient under curve -->
				<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#9A3B3B" stop-opacity="0.25" />
					<stop offset="100%" stop-color="#9A3B3B" stop-opacity="0.0" />
				</linearGradient>
			</defs>

			<!-- Horizontal Grid Lines -->
			{#each yLabels as { y, val } (val)}
				<line
					x1={padLeft}
					y1={y}
					x2={width - padRight}
					y2={y}
					stroke="rgba(42, 26, 22, 0.12)"
					stroke-dasharray="3 3"
				/>
				<text
					x={padLeft - 8}
					y={y + 4}
					text-anchor="end"
					class="fill-ink-muted/80 font-mono text-[10px] font-medium"
				>
					{val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}
				</text>
			{/each}

			<!-- Area Fill -->
			<path d={areaString} fill="url(#areaGradient)" />

			<!-- Line Path -->
			<path
				d={pathString}
				fill="none"
				stroke="#9A3B3B"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>

			<!-- Points & Interactive Hover -->
			{#each points as p, i (p.label)}
				<!-- Vertical Guideline on hover -->
				{#if hoveredIndex === i}
					<line
						x1={p.x}
						y1={padTop}
						x2={p.x}
						y2={padTop + plotHeight}
						stroke="#C08261"
						stroke-width="1.5"
						stroke-dasharray="2 2"
					/>
				{/if}

				<!-- Dot Marker -->
				<circle
					cx={p.x}
					cy={p.y}
					r={hoveredIndex === i ? 6 : 4}
					fill="#F2ECBE"
					stroke="#9A3B3B"
					stroke-width={hoveredIndex === i ? 3 : 2}
					class="cursor-pointer transition-all duration-150"
					role="presentation"
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
				/>

				<!-- X-Axis Label -->
				<text
					x={p.x}
					y={height - 8}
					text-anchor="middle"
					class="font-mono text-[11px] {hoveredIndex === i
						? 'fill-brick font-bold'
						: 'fill-ink-muted'}"
				>
					{p.label}
				</text>
			{/each}
		</svg>

		<!-- Tooltip floating badge -->
		{#if hoveredIndex !== null && points[hoveredIndex]}
			{@const p = points[hoveredIndex]}
			<div
				class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full transform rounded-sm border border-sand/30 bg-ink px-2.5 py-1.5 font-mono text-xs text-cream shadow-md transition-all duration-75"
				style="left: {(p.x / width) * 100}%; top: {((p.y - 12) / height) * 100}%;"
			>
				<p class="font-sans text-[10px] text-sand">{p.label} (Hari ini)</p>
				<p class="font-bold text-cream">
					{p.val.toLocaleString('id-ID')}
					<span class="font-normal text-sand/80">
						{selectedMetric === 'sessions' ? 'sesi' : 'hlm'}
					</span>
				</p>
			</div>
		{/if}
	</div>

	<!-- Chart Footer Highlights -->
	<div
		class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-3 font-mono text-xs text-ink-muted"
	>
		<div class="flex items-center gap-4">
			<span class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-brick"></span>
				<span>Puncak: Rabu (890 sesi)</span>
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-terracotta"></span>
				<span>Rerata: 645 sesi/hari</span>
			</span>
		</div>
		<span class="font-medium text-brick"> +24.1% dibandingkan pekan lalu </span>
	</div>
</div>
