<script lang="ts">
	interface Props {
		title: string;
		slug?: string;
		author?: string | null;
		src?: string | null;
		classification?: string | null;
		isFeatured?: boolean | null;
		isSaved?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
	}

	let {
		title,
		slug,
		author = 'Civitas Akademika UMKO',
		src = null,
		classification,
		isFeatured = false,
		isSaved = false,
		size = 'md',
		class: className = ''
	}: Props = $props();

	let imageError = $state(false);

	const coverSrc = $derived(src || (slug ? `/api/books/${slug}/cover` : null));

	// Deterministic color theme for typographic cover placeholder
	const themes = [
		{
			bg: 'bg-brick',
			text: 'text-cream',
			accent: 'border-cream/30',
			subtext: 'text-cream/80',
			tagBg: 'bg-black/25 text-cream'
		},
		{
			bg: 'bg-sand',
			text: 'text-ink',
			accent: 'border-ink/20',
			subtext: 'text-ink-muted',
			tagBg: 'bg-ink/10 text-ink'
		},
		{
			bg: 'bg-ink',
			text: 'text-cream',
			accent: 'border-sand/30',
			subtext: 'text-sand',
			tagBg: 'bg-brick/40 text-cream'
		},
		{
			bg: 'bg-terracotta',
			text: 'text-cream',
			accent: 'border-cream/30',
			subtext: 'text-cream/90',
			tagBg: 'bg-black/20 text-cream'
		}
	];

	// Simple hash function for consistent cover colors
	const themeIndex = $derived.by(() => {
		let hash = 0;
		for (let i = 0; i < title.length; i++) {
			hash = (hash << 5) - hash + title.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash) % themes.length;
	});

	const theme = $derived(themes[themeIndex]);

	const sizeClasses = {
		sm: 'w-25 text-[10px]',
		md: 'w-35 text-xs',
		lg: 'w-47.5 text-sm',
		xl: 'w-65 text-base'
	};
</script>

<div
	class="book-shadow book-spine-effect relative aspect-2/3 shrink-0 overflow-hidden rounded-sm border border-ink/10 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none {sizeClasses[
		size
	]} {className}"
>
	<!-- Bookmark ribbon indicator -->
	{#if isSaved || isFeatured}
		<div
			class="absolute top-0 right-3 z-20 flex h-6 w-4 items-end justify-center bg-brick pb-0.5 shadow-sm"
			style="clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);"
			title={isSaved ? 'Tersimpan di daftar baca' : 'Pilihan Pustakawan'}
		>
			<span class="h-1.5 w-1.5 rounded-full bg-cream"></span>
		</div>
	{/if}

	{#if coverSrc && !imageError}
		<img
			src={coverSrc}
			alt="Sampul buku {title}"
			class="h-full w-full object-cover"
			loading="lazy"
			onerror={() => (imageError = true)}
		/>
	{:else}
		<!-- Typographic Placeholder Book Cover (Anti-slop, real publisher design) -->
		<div
			class="flex h-full w-full flex-col justify-between p-3 sm:p-4 {theme.bg} {theme.text} relative"
		>
			<!-- Book edge inner border frame -->
			<div class="absolute inset-2 border {theme.accent} pointer-events-none rounded-xs"></div>

			<!-- Top header / classification -->
			<div class="relative z-10 flex items-start justify-between gap-1">
				<span class="font-mono text-[9px] font-medium tracking-widest uppercase opacity-75">
					ElibUMKO
				</span>
				{#if classification}
					<span class="rounded-xs px-1.5 py-0.5 font-mono text-[9px] {theme.tagBg} font-semibold">
						{classification}
					</span>
				{/if}
			</div>

			<!-- Title section -->
			<div class="relative z-10 my-auto px-1 text-center">
				<h3
					class="line-clamp-4 font-serif leading-tight font-bold {theme.text}"
					style="font-size: clamp(0.75rem, 4.5cqi, 1.15rem);"
				>
					{title}
				</h3>
				<div class="mx-auto my-2 h-px w-8 {theme.accent} opacity-60"></div>
			</div>

			<!-- Bottom Author section -->
			<div class="relative z-10 text-center">
				<p
					class="line-clamp-2 font-sans font-medium {theme.subtext}"
					style="font-size: clamp(0.65rem, 3.2cqi, 0.85rem);"
				>
					{author}
				</p>
			</div>
		</div>
	{/if}
</div>
