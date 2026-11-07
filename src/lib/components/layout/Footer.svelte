<script lang="ts">
	import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-svelte';
	import { page } from '$app/state';
	import type { LibraryProfile, CategoryData } from '#lib/types';

	interface Props {
		profile?: Partial<LibraryProfile>;
		popularCategories?: CategoryData[];
	}

	let { profile: customProfile, popularCategories: customCategories }: Props = $props();

	const profile = $derived<Partial<LibraryProfile>>(
		customProfile ?? (page.data?.profile as Partial<LibraryProfile> | undefined) ?? {}
	);

	const popularCategories = $derived<CategoryData[]>(
		customCategories ?? (page.data?.footerCategories as CategoryData[] | undefined) ?? []
	);
</script>

<footer
	class="border-t border-ink-muted/30 bg-ink pt-16 pb-12 text-cream selection:bg-brick selection:text-cream"
>
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<!-- Top Grid of 4 Columns -->
		<div
			class="grid grid-cols-1 gap-8 border-b border-cream/15 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10"
		>
			<!-- Col 1: Brand & Purpose (4 cols) -->
			<div class="lg:col-span-4">
				<div class="mb-4 flex items-center gap-2.5">
					<span
						class="flex h-8 w-8 items-center justify-center rounded-sm bg-brick font-serif text-lg font-bold text-cream shadow-sm"
					>
						E
					</span>
					<span class="font-serif text-xl font-bold tracking-tight text-cream"> ElibUMKO </span>
				</div>
				<p class="mb-4 max-w-sm font-sans text-xs leading-relaxed text-cream/75 sm:text-sm">
					Platform perpustakaan digital resmi {profile.institution ||
						'Universitas Muhammadiyah Kotabumi'}. Menyediakan akses instan ke seluruh khazanah buku
					rujukan keilmuan dan karya akademik kampus untuk dibaca nyaman di peramban.
				</p>
				<div
					class="inline-flex items-center gap-1.5 rounded-xs border border-cream/15 bg-black/30 px-2.5 py-1 font-mono text-[11px] text-sand"
				>
					<ShieldCheck size={14} class="text-brick" />
					<span>Sistem Terproteksi HKI & Anti-Unduh</span>
				</div>
			</div>

			<!-- Col 2: Navigasi (2 cols) -->
			<div class="lg:col-span-2">
				<h4 class="mb-4 font-mono text-xs font-bold tracking-wider text-sand uppercase">
					Navigasi
				</h4>
				<ul class="space-y-2.5 text-xs text-cream/80 sm:text-sm">
					<li>
						<a href="/" class="focus-library transition-colors hover:text-sand">Beranda</a>
					</li>
					<li>
						<a href="/rak" class="focus-library transition-colors hover:text-sand">Rak Buku</a>
					</li>
					<li>
						<a href="/#kategori" class="focus-library transition-colors hover:text-sand"
							>Klasifikasi DDC</a
						>
					</li>
					<li>
						<a href="/#rekomendasi" class="focus-library transition-colors hover:text-sand"
							>Pilihan Pustakawan</a
						>
					</li>
					<li>
						<a href="/#profil" class="focus-library transition-colors hover:text-sand"
							>Profil Perpustakaan</a
						>
					</li>
					<li>
						<a
							href="/komponen"
							class="focus-library font-mono text-xs text-sand/80 transition-colors hover:text-sand"
							>Katalog Desain</a
						>
					</li>
				</ul>
			</div>

			<!-- Col 3: Klasifikasi Populer Dinamis (3 cols) -->
			<div class="lg:col-span-3">
				<h4 class="mb-4 font-mono text-xs font-bold tracking-wider text-sand uppercase">
					Klasifikasi Populer
				</h4>
				<ul class="space-y-2.5 font-mono text-xs text-cream/80">
					{#each popularCategories as cat (cat.code)}
						<li>
							<a
								href="/rak/{cat.code}"
								class="focus-library flex items-center justify-between transition-colors hover:text-sand"
							>
								<span class="truncate pr-2">{cat.code} {cat.name}</span>
								<span class="shrink-0 text-sand/60">{cat.count} judul</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Col 4: Kontak & Lokasi Dinamis (3 cols) -->
			<div class="lg:col-span-3">
				<h4 class="mb-4 font-mono text-xs font-bold tracking-wider text-sand uppercase">
					Layanan & Lokasi
				</h4>
				<div class="space-y-3 text-xs text-cream/80">
					{#if profile.address}
						<div class="flex items-start gap-2.5">
							<MapPin size={16} class="mt-0.5 shrink-0 text-sand" />
							<span class="leading-relaxed">
								{profile.address}
							</span>
						</div>
					{/if}
					{#if profile.phone}
						<div class="flex items-center gap-2.5">
							<Phone size={15} class="shrink-0 text-sand" />
							<span class="font-mono">{profile.phone}</span>
						</div>
					{/if}
					{#if profile.email}
						<div class="flex items-center gap-2.5">
							<Mail size={15} class="shrink-0 text-sand" />
							<a href="mailto:{profile.email}" class="font-mono hover:underline">
								{profile.email}
							</a>
						</div>
					{/if}
					<div class="pt-2">
						<a
							href="/admin"
							class="focus-library inline-block rounded-sm border border-cream/20 bg-cream/10 px-3 py-1.5 font-sans text-xs text-cream transition-colors hover:bg-cream/20"
						>
							Portal Akses Admin &rarr;
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Copyright Bar -->
		<div
			class="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-cream/60 sm:flex-row"
		>
			<p>
				&copy; 2026 {profile.institution || 'Universitas Muhammadiyah Kotabumi'}. Hak Cipta
				Dilindungi Undang-Undang.
			</p>
			<p class="font-mono text-[11px] text-cream/40">
				Dirancang khusus dengan estetika ruang baca perpustakaan fisik.
			</p>
		</div>
	</div>
</footer>
