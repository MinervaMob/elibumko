<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Home, ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>{page.status} | ElibUMKO Perpustakaan Digital</title>
</svelte:head>

<div class="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
	<div class="rounded-full bg-brick/15 p-4 text-brick shadow-xs">
		<AlertTriangle size={36} />
	</div>

	<span class="mt-4 font-mono text-xs font-bold tracking-wider text-brick uppercase">
		Status Kode {page.status}
	</span>

	<h1 class="mt-2 font-serif text-2xl font-bold text-ink sm:text-3xl">
		Terjadi Kendala pada Sistem
	</h1>

	<p class="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
		{page.error?.message ||
			'Halaman yang Anda tuju sedang mengalami pemeliharaan atau terdapat kendala sementara saat memproses data.'}
	</p>

	<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
		<a
			href="/admin"
			class="focus-library flex items-center gap-2 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-colors hover:bg-brick/90 sm:text-sm"
		>
			<Home size={15} />
			<span>Kembali ke Beranda Admin</span>
		</a>
		<a
			href="/admin/profil"
			class="focus-library flex items-center gap-2 rounded-md border border-ink/20 bg-cream px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand/50 sm:text-sm"
		>
			<ArrowLeft size={15} />
			<span>Muat Ulang Halaman Profil</span>
		</a>
	</div>
</div>
