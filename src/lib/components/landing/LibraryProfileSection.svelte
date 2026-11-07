<script lang="ts">
	import { MapPin, Clock, Phone, Mail, Building } from 'lucide-svelte';
	import { page } from '$app/state';
	import type { LibraryProfile } from '#lib/types';

	interface Props {
		profile?: Partial<LibraryProfile>;
	}

	let { profile: customProfile }: Props = $props();

	const profile = $derived<Partial<LibraryProfile>>(
		customProfile ?? (page.data?.profile as Partial<LibraryProfile> | undefined) ?? {}
	);
</script>

<section id="profil" class="scroll-mt-16 border-t border-b border-sand-dark bg-sand py-16 sm:py-24">
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div class="mb-12 max-w-2xl">
			<div
				class="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-brick uppercase"
			>
				<Building size={14} />
				<span>Pusat Literasi Kampus</span>
			</div>
			<h2 class="font-serif text-2xl font-bold tracking-tight text-ink sm:text-4xl">
				Mengenal Perpustakaan UMKO
			</h2>
			<p class="mt-2 font-sans text-base leading-relaxed text-ink-muted">
				Tempat bertemunya gagasan, keheningan riset, dan dedikasi keilmuan yang melayani lebih dari
				ribuan mahasiswa dan dosen.
			</p>
		</div>

		<!-- Main 2-Column Grid -->
		<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
			<!-- Left column: Sejarah, Visi, Misi (7 cols) -->
			<div class="space-y-6 lg:col-span-7">
				<!-- Sejarah Singkat Card -->
				<div class="rounded-lg border border-ink/15 bg-cream/70 p-6 shadow-xs">
					<h3 class="mb-2 font-serif text-lg font-bold text-ink">Sejarah & Dedikasi Layanan</h3>
					<p class="font-sans text-sm leading-relaxed text-ink sm:text-[15px]">
						{profile.history}
					</p>
				</div>

				<!-- Visi & Misi Card -->
				<div class="rounded-lg border border-ink/15 bg-cream/70 p-6 shadow-xs">
					<div class="mb-4">
						<span
							class="mb-1 block font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>
							Visi Perpustakaan
						</span>
						<p class="font-serif text-base leading-snug font-bold text-ink sm:text-lg">
							"{profile.vision}"
						</p>
					</div>

					<div class="border-t border-ink/10 pt-4">
						<span
							class="mb-2 block font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>
							Misi Pelayanan
						</span>
						<ul class="space-y-2 font-sans text-sm text-ink">
							{#each profile.mission ?? [] as item, i (i)}
								<li class="flex items-start gap-2.5">
									<span class="mt-0.5 shrink-0 font-mono text-xs font-bold text-brick">
										0{i + 1}.
									</span>
									<span class="leading-relaxed">{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>

			<!-- Right column: Jam Layanan, Kontak, Lokasi (5 cols) -->
			<div class="space-y-5 lg:col-span-5">
				<!-- Jam Layanan Card -->
				<div class="rounded-lg border border-ink/15 bg-cream p-5 shadow-xs sm:p-6">
					<div class="mb-3 flex items-center gap-2 text-brick">
						<Clock size={18} />
						<h4 class="font-serif text-base font-bold text-ink">Jam Layanan Perpustakaan</h4>
					</div>
					<div class="space-y-2 font-sans text-xs text-ink sm:text-sm">
						<div class="flex items-start justify-between border-b border-ink/10 pb-2">
							<span class="font-medium">Hari Kerja:</span>
							<span class="text-right font-mono">{profile.hoursWeekday}</span>
						</div>
						<div class="flex items-start justify-between">
							<span class="font-medium">Akhir Pekan:</span>
							<span class="text-right font-mono">{profile.hoursSaturday}</span>
						</div>
					</div>
					<div
						class="mt-4 flex items-center gap-2 border-t border-ink/10 pt-3 text-xs text-ink-muted"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-600"></span>
						<span>Portal baca online ElibUMKO aktif 24 jam penuh tanpa jeda.</span>
					</div>
				</div>

				<!-- Kontak & Alamat Card -->
				<div class="rounded-lg border border-ink/15 bg-cream p-5 shadow-xs sm:p-6">
					<h4 class="mb-3 font-serif text-base font-bold text-ink">Kontak & Alamat Kampus</h4>
					<div class="space-y-3 text-xs text-ink sm:text-sm">
						<div class="flex items-start gap-3">
							<MapPin size={17} class="mt-0.5 shrink-0 text-brick" />
							<span class="leading-relaxed">{profile.address}</span>
						</div>
						<div class="flex items-center gap-3">
							<Phone size={17} class="shrink-0 text-brick" />
							<span class="font-mono">{profile.phone}</span>
						</div>
						<div class="flex items-center gap-3">
							<Mail size={17} class="shrink-0 text-brick" />
							<a
								href="mailto:{profile.email}"
								class="focus-library font-mono transition-colors hover:text-brick"
							>
								{profile.email}
							</a>
						</div>
					</div>

					<div class="mt-5 border-t border-ink/10 pt-3">
						<a
							href={profile.googleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="focus-library inline-flex w-full items-center justify-center gap-2 rounded-sm border border-ink/15 bg-sand/60 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand"
						>
							<MapPin size={14} />
							<span>Buka Peta Lokasi di Google Maps &rarr;</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
