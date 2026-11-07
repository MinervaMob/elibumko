<script lang="ts">
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		BookOpen,
		FolderTree,
		Activity,
		Settings,
		ExternalLink,
		LogOut,
		ShieldCheck,
		X
	} from 'lucide-svelte';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
		user?: {
			name?: string;
			email?: string;
		} | null;
	}

	let { isOpen = false, onClose, user }: Props = $props();

	const userName = $derived(user?.name || page.data.user?.name || 'Pustakawan');
	const userRole = $derived(page.data.user?.role || 'Pustakawan');
	const userInitials = $derived.by(() => {
		const clean = userName.replace(/^(Drs\.|Dr\.|Prof\.|H\.|Hj\.)\s+/gi, '').trim();
		const words = clean.split(/\s+/).filter(Boolean);
		if (words.length >= 2) {
			return `${words[0][0]}${words[1][0]}`.toUpperCase();
		}
		return clean.slice(0, 2).toUpperCase() || 'P';
	});

	const totalBooksBadge = $derived.by(() => {
		const count = page.data?.stats?.totalBooks ?? page.data?.books?.length;
		return count !== undefined ? count.toLocaleString('id-ID') : undefined;
	});

	const ddcCountBadge = $derived.by(() => {
		const count = page.data?.ddcTree?.length ?? page.data?.categories?.length ?? 10;
		return count.toString();
	});

	const navItems = $derived([
		{
			label: 'Ringkasan',
			href: '/admin',
			icon: LayoutDashboard,
			badge: undefined
		},
		{
			label: 'Manajemen Buku',
			href: '/admin/buku',
			icon: BookOpen,
			badge: totalBooksBadge
		},
		{
			label: 'Klasifikasi DDC',
			href: '/admin/kategori',
			icon: FolderTree,
			badge: ddcCountBadge
		},
		{
			label: 'Log & Aktivitas',
			href: '/admin/aktivitas',
			icon: Activity,
			badge: undefined
		},
		{
			label: 'Pengaturan',
			href: '/admin/pengaturan',
			icon: Settings,
			badge: undefined
		}
	]);

	function isActive(href: string): boolean {
		if (href === '/admin') {
			return page.url.pathname === '/admin';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

{#if isOpen}
	<!-- Mobile backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-xs lg:hidden"
		tabindex="-1"
		onclick={onClose}
		aria-label="Tutup menu navigasi"
	></button>
{/if}

<aside
	class="fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-ink/15 bg-cream shadow-[2px_0_12px_rgba(42,26,22,0.06)] transition-transform duration-200 lg:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
	aria-label="Navigasi Utama Admin"
>
	<!-- Header / Logo Panel -->
	<div class="flex items-center justify-between border-b border-ink/15 p-5">
		<a href="/admin" class="group focus-library flex flex-col gap-0.5 rounded-sm">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-sm bg-brick font-serif text-lg font-black text-cream shadow-xs"
				>
					E
				</div>
				<div class="flex flex-col">
					<span
						class="font-serif text-lg leading-tight font-bold text-ink transition-colors group-hover:text-brick"
					>
						ElibUMKO
					</span>
					<span class="font-mono text-[9px] tracking-widest text-ink-muted uppercase">
						Panel Pustakawan
					</span>
				</div>
			</div>
		</a>

		<button
			type="button"
			class="focus-library rounded-sm p-1.5 text-ink-muted hover:bg-sand/60 hover:text-ink lg:hidden"
			onclick={onClose}
			aria-label="Tutup sidebar"
		>
			<X size={18} />
		</button>
	</div>

	<!-- Navigation Menu -->
	<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menu Admin">
		<div class="px-3 pb-2">
			<span class="block font-mono text-[10px] font-bold tracking-wider text-ink-muted uppercase">
				Navigasi Utama
			</span>
		</div>

		{#each navItems as item (item.href)}
			{@const active = isActive(item.href)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				onclick={onClose}
				class="focus-library flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all {active
					? 'bg-brick font-semibold text-cream shadow-xs'
					: 'text-ink hover:bg-sand/60 hover:text-ink'}"
				aria-current={active ? 'page' : undefined}
			>
				<div class="flex min-w-0 items-center gap-2.5">
					<Icon size={18} class="shrink-0 {active ? 'text-cream' : 'text-ink-muted'}" />
					<span class="truncate">{item.label}</span>
				</div>

				{#if item.badge}
					<span
						class="shrink-0 rounded-xs px-1.5 py-0.5 font-mono text-[10px] {active
							? 'bg-cream/20 text-cream'
							: 'bg-sand text-ink-muted'}"
					>
						{item.badge}
					</span>
				{/if}
			</a>
		{/each}

		<div class="px-3 pt-4 pb-2">
			<span class="block font-mono text-[10px] font-bold tracking-wider text-ink-muted uppercase">
				Tautan Cepat
			</span>
		</div>

		<a
			href="/"
			target="_blank"
			rel="noopener noreferrer"
			class="focus-library flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-sand/40 hover:text-ink"
		>
			<div class="flex items-center gap-2.5">
				<ExternalLink size={16} class="shrink-0 text-terracotta" />
				<span>Lihat Perpustakaan</span>
			</div>
			<span class="font-mono text-[9px] tracking-wider text-ink-muted/80 uppercase"> Publik </span>
		</a>
	</nav>

	<!-- Super Admin Profile & Status Footer -->
	<div class="space-y-3 border-t border-ink/15 bg-sand/20 p-4">
		<div class="flex items-center gap-3 rounded-md border border-ink/10 bg-sand/40 p-2">
			<div
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brick font-serif text-sm font-bold text-cream shadow-xs"
			>
				{userInitials}
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1">
					<p class="truncate text-xs font-bold text-ink">{userName}</p>
					<span title="Pustakawan Terverifikasi"
						><ShieldCheck size={12} class="shrink-0 text-brick" /></span
					>
				</div>
				<p class="truncate font-mono text-[10px] text-ink-muted">
					{userRole}
				</p>
			</div>
		</div>

		<form method="POST" action="/admin/logout" class="w-full">
			<button
				type="submit"
				class="focus-library flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-ink/20 px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brick hover:bg-sand/50 hover:text-brick"
			>
				<LogOut size={14} />
				<span>Keluar Sistem</span>
			</button>
		</form>
	</div>
</aside>
