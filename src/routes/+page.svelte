<script lang="ts">
	import type { PageData } from './$types';
	import Header from '#lib/components/layout/Header.svelte';
	import HeroSection from '#lib/components/landing/HeroSection.svelte';
	import CategorySection from '#lib/components/landing/CategorySection.svelte';
	import FeaturedSection from '#lib/components/landing/FeaturedSection.svelte';
	import PopularSection from '#lib/components/landing/PopularSection.svelte';
	import LibraryProfileSection from '#lib/components/landing/LibraryProfileSection.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>ElibUMKO | Perpustakaan Digital Universitas Muhammadiyah Kotabumi</title>
	<meta
		name="description"
		content="Perpustakaan digital resmi Universitas Muhammadiyah Kotabumi. Baca ratusan ebook teks kuliah, monograf keilmuan, dan publikasi dosen secara langsung di peramban."
	/>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-cream text-ink selection:bg-terracotta/30 selection:text-ink"
>
	<!-- A1.1: Sticky Header with shrink on scroll -->
	<Header />

	<main class="grow">
		<!-- A1.2 & A1.3: Asymmetric Hero with Large Autocomplete Search and Tilted Books -->
		<HeroSection books={data.books} />

		<!-- A1.4: Category section (Vertical book spines / catalog cards) -->
		<CategorySection categories={data.categories} />

		<!-- A1.5: Recommended Books (Scroll-snap horizontal carousel with 'Pilihan Pustakawan' badge) -->
		<FeaturedSection books={data.books} />

		<!-- A1.6: Popular Books (1-10 Editorial ranking list with large Fraunces numerals) -->
		<PopularSection books={data.books} />

		<!-- A1.7: Library Profile (Warm Sand background with history, vision/mission, service hours, contact) -->
		<LibraryProfileSection profile={data.profile} />
	</main>

	<!-- A1.8: Footer (Deep ink / brown with links, contact, service hours, and copyright) -->
	<Footer profile={data.profile} popularCategories={data.categories.slice(0, 5)} />
</div>
