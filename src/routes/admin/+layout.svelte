<script lang="ts">
	import type { LayoutProps } from './$types';
	import { AdminSidebar, AdminHeader } from '#lib';

	let { data, children }: LayoutProps = $props();

	let isSidebarOpen = $state(false);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}
</script>

<svelte:head>
	<title>Panel Pustakawan | ElibUMKO Universitas Muhammadiyah Kotabumi</title>
</svelte:head>

<div class="flex min-h-screen bg-cream text-ink">
	<!-- Sidebar (Fixed) -->
	<AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={data.user} />

	<!-- Main Admin Shell (offset by 64 = 16rem on desktop) -->
	<div class="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
		<AdminHeader onToggleSidebar={toggleSidebar} />

		<main class="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>

		<!-- Subdued Admin Footer -->
		<footer
			class="flex flex-col items-center justify-between gap-2 border-t border-ink/10 bg-sand/15 px-4 py-4 text-xs text-ink-muted sm:flex-row sm:px-6"
		>
			<div class="flex items-center gap-2">
				<span class="font-serif font-bold text-ink">ElibUMKO</span>
				<span>— Sistem Informasi Perpustakaan Digital UMKO</span>
			</div>
			<div class="font-mono text-[11px]">
				Status Server: <span class="font-semibold text-brick"
					>Tersambung (PostgreSQL + Local Storage)</span
				>
			</div>
		</footer>
	</div>
</div>
