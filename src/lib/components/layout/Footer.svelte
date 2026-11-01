<script lang="ts">
	import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-svelte';
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
					Platform perpustakaan digital lokal Universitas Muhammadiyah Kotabumi. Menyediakan akses
					instan ke seluruh khazanah buku rujukan keilmuan dan karya akademik kampus untuk dibaca
					nyaman di peramban.
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

			<!-- Col 3: Klasifikasi Utama (3 cols) -->
			<div class="lg:col-span-3">
				<h4 class="mb-4 font-mono text-xs font-bold tracking-wider text-sand uppercase">
					Klasifikasi Populer
				</h4>
				<ul class="space-y-2.5 font-mono text-xs text-cream/80">
					<li>
						<a
							href="/rak/370"
							class="focus-library flex items-center justify-between transition-colors hover:text-sand"
						>
							<span>370 Pendidikan & Keguruan</span>
							<span class="text-sand/60">83 judul</span>
						</a>
					</li>
					<li>
						<a
							href="/rak/297"
							class="focus-library flex items-center justify-between transition-colors hover:text-sand"
						>
							<span>297 Kemuhammadiyahan</span>
							<span class="text-sand/60">65 judul</span>
						</a>
					</li>
					<li>
						<a
							href="/rak/650"
							class="focus-library flex items-center justify-between transition-colors hover:text-sand"
						>
							<span>650 Manajemen Bisnis</span>
							<span class="text-sand/60">61 judul</span>
						</a>
					</li>
					<li>
						<a
							href="/rak/000"
							class="focus-library flex items-center justify-between transition-colors hover:text-sand"
						>
							<span>000 Komputer & Data</span>
							<span class="text-sand/60">42 judul</span>
						</a>
					</li>
					<li>
						<a
							href="/rak/300"
							class="focus-library flex items-center justify-between transition-colors hover:text-sand"
						>
							<span>300 Ilmu Sosial & Hukum</span>
							<span class="text-sand/60">54 judul</span>
						</a>
					</li>
				</ul>
			</div>

			<!-- Col 4: Kontak Kampus (3 cols) -->
			<div class="lg:col-span-3">
				<h4 class="mb-4 font-mono text-xs font-bold tracking-wider text-sand uppercase">
					Layanan & Lokasi
				</h4>
				<div class="space-y-3 text-xs text-cream/80">
					<div class="flex items-start gap-2.5">
						<MapPin size={16} class="mt-0.5 shrink-0 text-sand" />
						<span class="leading-relaxed">
							Jl. Hasan Kepala Ratu No. 1052, Sindang Sari, Kotabumi, Lampung Utara 34517
						</span>
					</div>
					<div class="flex items-center gap-2.5">
						<Phone size={15} class="shrink-0 text-sand" />
						<span class="font-mono">(0724) 22894</span>
					</div>
					<div class="flex items-center gap-2.5">
						<Mail size={15} class="shrink-0 text-sand" />
						<span class="font-mono">perpustakaan@umko.ac.id</span>
					</div>
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
			<p>&copy; 2026 Universitas Muhammadiyah Kotabumi. Hak Cipta Dilindungi Undang-Undang.</p>
			<p class="font-mono text-[11px] text-cream/40">
				Dirancang khusus dengan estetika ruang baca perpustakaan fisik.
			</p>
		</div>
	</div>
</footer>
