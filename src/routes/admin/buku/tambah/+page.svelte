<script lang="ts">
	/**
	 * /admin/buku/tambah — Halaman Registrasi & Unggah Naskah Baru
	 *
	 * Fitur:
	 * - Unggah berkas naskah format PDF (.pdf), Word (.docx), dan EPUB (.epub)
	 * - Ekstraksi otomatis cerdas (Auto-fill) untuk judul, penulis, halaman, ISBN, bab, dll.
	 * - Visualisasi sampul buku interaktif secara real-time
	 * - Pemilihan klasifikasi Dewey Decimal Classification (DDC) & Rak Digital
	 * - Kelola daftar isi dinamis (Table of Contents)
	 * - Pengukur skor kelengkapan metadata naskah
	 */

	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { TableOfContentItem } from '#lib/types';
	import BookCover from '#lib/components/book/BookCover.svelte';
	import {
		ArrowLeft,
		UploadCloud,
		FileText,
		CheckCircle2,
		AlertCircle,
		Sparkles,
		Plus,
		Trash2,
		BookOpen,
		RefreshCw,
		Image as ImageIcon,
		Check
	} from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Form State
	let title = $state('');
	let author = $state('');
	let publisher = $state('UMKO Press');
	let year = $state<number>(new Date().getFullYear());
	let edition = $state('Edisi Pertama');
	let isbn = $state('');
	let pages = $state<number | undefined>(undefined);
	let language = $state('Bahasa Indonesia');
	let classification = $state('370');
	let ddcCode = $state('300');
	let ddcName = $state('Ilmu Sosial, Hukum & Pendidikan');
	let category = $state('Pendidikan & Pedagogi');
	let tagInput = $state('');
	let tags = $state<string[]>(['Pendidikan & Pedagogi', 'Buku Ajar', 'UMKO']);
	let synopsis = $state('');
	let isFeatured = $state(false);
	let fileType = $state<'pdf' | 'epub' | 'docx'>('pdf');
	let coverUrl = $state<string | null>(null);

	// Cover Source Options:
	// 'page1': Otomatis dari lembar pertama dokumen
	// 'typography': Sampul tipografi resmi UMKO (fallback/opsional)
	// 'custom': Unggah sampul grafis kustom
	let coverSource = $state<'page1' | 'typography' | 'custom'>('typography');
	let extractedPageCoverUrl = $state<string | null>(null);
	let customCoverUrl = $state<string | null>(null);
	let isExtractingCover = $state(false);

	// TOC State
	let tocItems = $state<TableOfContentItem[]>([{ title: 'Bab I: Pendahuluan', page: 1 }]);

	// Upload & Extraction State
	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);
	let uploadProgress = $state(0);
	let isProcessing = $state(false);
	let extractionSuccess = $state(false);
	let uploadedFilePath = $state<string | undefined>(undefined);
	let uploadedFileSize = $state<number | undefined>(undefined);
	let autoFilledFields = $state<string[]>([]);
	let extractionLogs = $state<string[]>([]);
	let errorMessage = $state<string | null>(null);
	let isSubmitting = $state(false);
	let isUploadingCover = $state(false);

	// Completeness Calculator
	const completenessScore = $derived.by(() => {
		let score = 0;
		if (uploadedFilePath || selectedFile) score += 25;
		if (title.trim()) score += 20;
		if (author.trim()) score += 15;
		if (pages && pages > 0) score += 10;
		if (isbn.trim()) score += 10;
		if (synopsis.trim()) score += 10;
		if (coverSource === 'page1' && coverUrl) score += 10;
		else if (coverSource === 'custom' && coverUrl) score += 10;
		else if (coverSource === 'typography') score += 10;
		return Math.min(100, score);
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processManuscriptFile(file);
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) processManuscriptFile(file);
	}

	async function extractPdfFirstPageCover(file: File): Promise<string | null> {
		try {
			isExtractingCover = true;
			const pdfjsLib = await import('pdfjs-dist');
			pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

			const arrayBuffer = await file.arrayBuffer();
			const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
			const pdfDoc = await loadingTask.promise;
			if (pdfDoc.numPages < 1) return null;

			const page = await pdfDoc.getPage(1);
			const viewport = page.getViewport({ scale: 1.5 });

			const canvas = document.createElement('canvas');
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;

			await page.render({ canvasContext: ctx, viewport, canvas }).promise;

			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
			});

			if (!blob) return null;

			const baseName = file.name.replace(/\.[^/.]+$/, '');
			const fd = new FormData();
			fd.append('file', blob, `cover-page1-${baseName}.jpg`);
			fd.append('type', 'cover');

			const uploadRes = await fetch('/api/admin/upload', {
				method: 'POST',
				body: fd
			});

			if (!uploadRes.ok) return null;
			const uploadData = await uploadRes.json();
			return uploadData.coverUrl || uploadData.url || null;
		} catch (err: unknown) {
			console.warn('Ekstraksi sampul lembar 1 PDF dilewati:', err);
			return null;
		} finally {
			isExtractingCover = false;
		}
	}

	async function processManuscriptFile(file: File) {
		const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
		if (!['.pdf', '.docx', '.doc', '.epub'].includes(ext)) {
			errorMessage =
				'Format berkas tidak didukung. Harap unggah PDF (.pdf), Word (.docx), atau EPUB (.epub).';
			return;
		}

		selectedFile = file;
		fileType = ext === '.epub' ? 'epub' : ext === '.docx' || ext === '.doc' ? 'docx' : 'pdf';
		errorMessage = null;
		isProcessing = true;
		uploadProgress = 15;
		autoFilledFields = [];
		extractionLogs = [];

		// Otomatis ekstrak lembar pertama PDF sebagai sampul muka
		if (ext === '.pdf') {
			extractPdfFirstPageCover(file).then((pdfCoverUrl) => {
				if (pdfCoverUrl) {
					extractedPageCoverUrl = pdfCoverUrl;
					coverSource = 'page1';
					coverUrl = pdfCoverUrl;
					if (!autoFilledFields.includes('Sampul (Lembar 1)')) {
						autoFilledFields = [...autoFilledFields, 'Sampul (Lembar 1)'];
					}
				}
			});
		}

		const formData = new FormData();
		formData.append('file', file);
		formData.append('save', 'true');

		// Simulasikan progress bertahap selama transmisi
		const progressTimer = setInterval(() => {
			if (uploadProgress < 85) {
				uploadProgress += 15;
			}
		}, 200);

		try {
			const res = await fetch('/api/admin/books/extract', {
				method: 'POST',
				body: formData
			});

			clearInterval(progressTimer);
			uploadProgress = 100;

			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.message || 'Gagal memproses berkas naskah.');
			}

			if (result.saved) {
				uploadedFilePath = result.saved.filePath;
				uploadedFileSize = result.saved.size;
			}

			// Isi otomatis formulir dengan metadata yang diekstrak
			if (result.metadata) {
				const meta = result.metadata;
				const filled: string[] = [];

				if (meta.title && meta.title.trim()) {
					title = meta.title.trim();
					filled.push('Judul Naskah');
				}
				if (meta.author && meta.author.trim()) {
					author = meta.author.trim();
					filled.push('Penulis');
				}
				if (meta.publisher && meta.publisher.trim()) {
					publisher = meta.publisher.trim();
					filled.push('Penerbit');
				}
				if (meta.year) {
					year = Number(meta.year);
					filled.push('Tahun Terbit');
				}
				if (meta.pages && meta.pages > 0) {
					pages = Number(meta.pages);
					filled.push('Jumlah Halaman');
				}
				if (meta.isbn && meta.isbn.trim()) {
					isbn = meta.isbn.trim();
					filled.push('Nomor ISBN');
				}
				if (meta.edition && meta.edition.trim()) {
					edition = meta.edition.trim();
					filled.push('Edisi/Cetakan');
				}
				if (meta.classification && meta.classification.trim()) {
					classification = meta.classification.trim();
					filled.push('Call Number DDC');
				}
				if (meta.ddcCode) {
					ddcCode = meta.ddcCode;
					ddcName = meta.ddcName || ddcName;
					category = meta.category || category;
					filled.push('Klasifikasi DDC');
				}
				if (Array.isArray(meta.tags) && meta.tags.length > 0) {
					tags = meta.tags;
					filled.push('Kata Kunci');
				}
				if (meta.synopsis && meta.synopsis.trim()) {
					synopsis = meta.synopsis.trim();
					filled.push('Sinopsis / Abstrak');
				}
				if (Array.isArray(meta.toc) && meta.toc.length > 0) {
					tocItems = meta.toc;
					filled.push('Daftar Isi (' + meta.toc.length + ' bab)');
				}
				if (meta.coverUrl) {
					extractedPageCoverUrl = meta.coverUrl;
					coverSource = 'page1';
					coverUrl = meta.coverUrl;
					filled.push('Sampul (Lembar 1)');
				}

				autoFilledFields = filled;
				extractionLogs = meta.summaryLog || [];
				extractionSuccess = true;
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Terjadi gangguan koneksi unggah.';
			errorMessage = msg;
			uploadProgress = 0;
		} finally {
			clearInterval(progressTimer);
			isProcessing = false;
		}
	}

	function resetUploadedFile() {
		selectedFile = null;
		uploadedFilePath = undefined;
		uploadedFileSize = undefined;
		uploadProgress = 0;
		extractionSuccess = false;
		autoFilledFields = [];
		extractionLogs = [];
		extractedPageCoverUrl = null;
		customCoverUrl = null;
		coverSource = 'typography';
		coverUrl = null;
		errorMessage = null;
		classification = '370';
		ddcCode = '300';
		ddcName = 'Ilmu Sosial, Hukum & Pendidikan';
		category = 'Pendidikan & Pedagogi';
		tags = ['Pendidikan & Pedagogi', 'Buku Ajar', 'UMKO'];
		synopsis = '';
	}

	function onDdcChange(code: string) {
		const found = data.ddcTree.find((d) => d.code === code);
		if (found) {
			ddcCode = found.code;
			ddcName = found.name;

			const mapping: Record<string, { cat: string; call: string }> = {
				'000': { cat: 'Komputer & Sains Data', call: '005.1' },
				'100': { cat: 'Filsafat & Etika', call: '170' },
				'200': { cat: 'Kemuhammadiyahan & Islam', call: '297.6' },
				'300': { cat: 'Pendidikan & Pedagogi', call: '370' },
				'400': { cat: 'Bahasa & Budaya Lampung', call: '899.221' },
				'500': { cat: 'Sains & Matematika', call: '510' },
				'600': { cat: 'Manajemen & Ekonomi Syariah', call: '658' }
			};

			if (mapping[code]) {
				category = mapping[code].cat;
				classification = mapping[code].call;
			} else {
				classification = code;
			}
		}
	}

	function onCategoryChange(selectedCategoryName: string) {
		category = selectedCategoryName;
		const mapping: Record<string, { ddc: string; call: string }> = {
			'Komputer & Sains Data': { ddc: '000', call: '005.1' },
			'Filsafat & Etika': { ddc: '100', call: '170' },
			'Kemuhammadiyahan & Islam': { ddc: '200', call: '297.6' },
			'Ilmu Sosial & Hukum': { ddc: '300', call: '340' },
			'Pendidikan & Pedagogi': { ddc: '300', call: '370.7' },
			'Bahasa & Budaya Lampung': { ddc: '400', call: '899.221' },
			'Sains & Matematika': { ddc: '500', call: '510' },
			'Manajemen & Ekonomi Syariah': { ddc: '600', call: '658' }
		};

		if (mapping[selectedCategoryName]) {
			ddcCode = mapping[selectedCategoryName].ddc;
			const found = data.ddcTree.find((d) => d.code === ddcCode);
			if (found) ddcName = found.name;
			classification = mapping[selectedCategoryName].call;
		}
	}

	function generateClientSmartTags() {
		const resultTags: string[] = [];
		const pushTag = (t: string) => {
			const clean = t.trim();
			if (clean && !resultTags.includes(clean)) {
				resultTags.push(clean);
			}
		};

		if (category) pushTag(category);

		const combined = `${title} ${synopsis}`;
		const keywords: [RegExp, string][] = [
			[/metodologi\s*penelitian/i, 'Metodologi Penelitian'],
			[/pendidikan\s*matematika/i, 'Pendidikan Matematika'],
			[/sains/i, 'Sains'],
			[/prosa\s*fiksi|kajian\s*prosa/i, 'Prosa Fiksi'],
			[/sastra\s*indonesia/i, 'Sastra Indonesia'],
			[/apresiasi\s*sastra/i, 'Apresiasi Sastra'],
			[/teori\s*sastra/i, 'Teori Sastra'],
			[/novel|cerpen/i, 'Novel & Cerpen'],
			[/kemuhammadiyahan/i, 'Kemuhammadiyahan'],
			[/tajdid/i, 'Tajdid'],
			[/al-ma'?un/i, 'Teologi Al-Maun'],
			[/filsafat/i, 'Filsafat'],
			[/algoritma|pemrograman/i, 'Pemrograman'],
			[/hukum/i, 'Ilmu Hukum'],
			[/ekonomi\s*syariah/i, 'Ekonomi Syariah'],
			[/manajemen/i, 'Manajemen'],
			[/bahasa\s*lampung|budaya\s*lampung/i, 'Budaya Lampung'],
			[/kurikulum/i, 'Kurikulum'],
			[/evaluasi/i, 'Evaluasi Pembelajaran'],
			[/statistika/i, 'Statistika Terapan']
		];

		for (const [r, t] of keywords) {
			if (r.test(combined)) pushTag(t);
		}

		if (tocItems && tocItems.length > 0) {
			for (const item of tocItems.slice(0, 4)) {
				const stripped = item.title
					.replace(/^Bab\s+[IVXLCDM\d]+[:\s-]*/i, '')
					.replace(/\s*hlm\.?.*$/i, '')
					.trim();
				if (stripped.length > 3 && stripped.length < 25 && stripped.split(/\s+/).length <= 3) {
					if (/\.(pdf|docx|epub|jpe?g|png)$/i.test(stripped) || /cover/i.test(stripped)) continue;
					pushTag(stripped);
				}
			}
		}

		pushTag('Buku Ajar');
		pushTag('UMKO');

		tags = resultTags.slice(0, 7);
		if (!autoFilledFields.includes('Kata Kunci')) {
			autoFilledFields = [...autoFilledFields, 'Kata Kunci'];
		}
	}

	function generateClientSmartSynopsis() {
		const cleanT = title.trim() || 'Naskah Buku';
		const cleanA = author.trim() || 'Dosen Universitas Muhammadiyah Kotabumi';
		const cleanC = category || 'Pendidikan & Pedagogi';
		const cleanP = publisher || 'UMKO Press';

		const tocHighlights =
			tocItems && tocItems.length > 0
				? ` Naskah ini terstruktur secara komprehensif yang memuat pokok bahasan utama meliputi: ${tocItems
						.slice(0, 4)
						.map((t) => t.title.replace(/^Bab\s+[IVXLCDM\d]+[:\s-]*/i, '').trim())
						.join(', ')}.`
				: '';

		synopsis = `Buku "${cleanT}" karya ${cleanA} merupakan buku referensi dan bahan ajar akademik terstandar pada bidang ${cleanC}. Disusun secara sistematis guna memfasilitasi penguasaan konsep teoretis serta penerapan praktis bagi mahasiswa dan akademisi di lingkungan Universitas Muhammadiyah Kotabumi.${tocHighlights} Diterbitkan secara resmi oleh ${cleanP} sebagai bagian dari penguatan literasi ilmiah dan kurikulum pendidikan tinggi.`;

		if (!autoFilledFields.includes('Sinopsis / Abstrak')) {
			autoFilledFields = [...autoFilledFields, 'Sinopsis / Abstrak'];
		}
	}

	function addTag() {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter((t) => t !== tagToRemove);
	}

	function addTocRow() {
		const lastPage = tocItems[tocItems.length - 1]?.page ?? 1;
		tocItems = [
			...tocItems,
			{
				title: `Bab ${tocItems.length + 1}: `,
				page: lastPage + 25
			}
		];
	}

	function removeTocRow(idx: number) {
		tocItems = tocItems.filter((_, i) => i !== idx);
	}

	function selectCoverSource(source: 'page1' | 'typography' | 'custom') {
		coverSource = source;
		if (source === 'page1') {
			coverUrl = extractedPageCoverUrl;
		} else if (source === 'typography') {
			coverUrl = null;
		} else if (source === 'custom') {
			coverUrl = customCoverUrl;
		}
	}

	async function handleCoverSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];
		isUploadingCover = true;
		errorMessage = null;

		try {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('type', 'cover');

			const res = await fetch('/api/admin/upload', {
				method: 'POST',
				body: fd
			});

			const resData = await res.json();
			if (!res.ok) {
				throw new Error(resData.message || 'Gagal mengunggah berkas sampul.');
			}

			customCoverUrl = resData.coverUrl || resData.url;
			coverSource = 'custom';
			coverUrl = customCoverUrl;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Gagal mengunggah sampul';
			errorMessage = message;
		} finally {
			isUploadingCover = false;
		}
	}

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!title.trim()) {
			errorMessage = 'Judul naskah wajib diisi.';
			window.scrollTo({ top: 300, behavior: 'smooth' });
			return;
		}
		if (!author.trim()) {
			errorMessage = 'Nama penulis / pengarang wajib diisi.';
			window.scrollTo({ top: 300, behavior: 'smooth' });
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		const payload = {
			title: title.trim(),
			author: author.trim(),
			publisher: publisher.trim(),
			year,
			edition: edition.trim(),
			isbn: isbn.trim(),
			pages,
			language,
			classification,
			ddcCode,
			ddcName,
			category,
			tags,
			synopsis: synopsis.trim(),
			toc: tocItems,
			isFeatured,
			fileType,
			filePath: uploadedFilePath,
			fileSize: uploadedFileSize,
			coverUrl: coverSource === 'typography' ? null : coverUrl
		};

		try {
			const res = await fetch('/api/admin/books', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const resData = await res.json();
			if (!res.ok) {
				throw new Error(resData.message || 'Gagal mendaftarkan naskah buku ke sistem.');
			}

			// Sukses, alihkan kembali ke katalog
			goto('/admin/buku');
		} catch (err: unknown) {
			errorMessage =
				err instanceof Error ? err.message : 'Terjadi kegagalan sistem saat menyimpan.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Unggah & Daftarkan Naskah Baru — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-8 pb-16">
	<!-- Top Navigation & Action Header -->
	<div
		class="sticky top-0 z-30 -mx-4 flex flex-col items-start justify-between gap-4 border-b border-ink/15 bg-cream/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 md:flex-row md:items-center"
	>
		<div class="flex items-center gap-3.5">
			<a
				href="/admin/buku"
				class="focus-library rounded-md border border-ink/15 bg-sand/30 p-2 text-ink-muted transition-colors hover:border-ink/30 hover:bg-sand/60 hover:text-ink"
				title="Kembali ke Katalog Naskah"
			>
				<ArrowLeft size={18} />
			</a>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="font-serif text-xl font-bold tracking-tight text-ink sm:text-2xl">
						Unggah & Daftarkan Naskah Baru
					</h1>
					<span
						class="hidden items-center gap-1 rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brick sm:inline-flex"
					>
						<Sparkles size={12} />
						Auto-Fill Aktif
					</span>
				</div>
				<p class="text-xs text-ink-muted">
					Sistem penyimpanan terproteksi repositori digital Universitas Muhammadiyah Kotabumi
				</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex w-full items-center justify-end gap-2.5 sm:w-auto">
			<a
				href="/admin/buku"
				class="focus-library rounded-md border border-ink/20 px-3.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-sand/40 hover:text-ink"
			>
				Batal
			</a>
			<button
				type="button"
				onclick={handleSubmit}
				disabled={isSubmitting || isProcessing}
				class="focus-library flex items-center gap-2 rounded-md bg-brick px-5 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 disabled:opacity-50 sm:text-sm"
			>
				{#if isSubmitting}
					<RefreshCw size={15} class="animate-spin" />
					<span>Menyimpan ke Repositori...</span>
				{:else}
					<Check size={16} />
					<span>Simpan & Publikasikan</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Alert Notification -->
	{#if errorMessage}
		<div
			class="animate-in fade-in flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-xs text-red-900 shadow-xs sm:text-sm"
		>
			<AlertCircle size={18} class="mt-0.5 shrink-0 text-red-600" />
			<div class="flex-1">
				<p class="font-bold">Terjadi Kesalahan</p>
				<p class="mt-0.5">{errorMessage}</p>
			</div>
		</div>
	{/if}

	<!-- Form Grid Layout (Main Columns + Sidebar Preview) -->
	<form onsubmit={handleSubmit} class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
		<!-- Left Main Column: Form Inputs & File Dropzone (8 cols) -->
		<div class="space-y-6 lg:col-span-8">
			<!-- Section 1: Dropzone Berkas Naskah Digital -->
			<div
				class="rounded-lg border border-ink/15 bg-white/70 p-6 shadow-xs backdrop-blur-xs sm:p-7"
			>
				<div class="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
					<div class="flex items-center gap-2">
						<div class="rounded-xs bg-brick/10 p-1.5 text-brick">
							<UploadCloud size={18} />
						</div>
						<div>
							<h2 class="font-serif text-base font-bold text-ink">Berkas Naskah Digital</h2>
							<p class="text-xs text-ink-muted">
								Unggah naskah format PDF, Microsoft Word (.docx), atau EPUB
							</p>
						</div>
					</div>
					<span class="font-mono text-xs text-ink-muted">Maksimal 100 MB</span>
				</div>

				<!-- Drag & Drop Zone -->
				{#if !selectedFile}
					<div
						role="region"
						aria-label="Area unggah naskah digital"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
						class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 {isDragging
							? 'border-brick bg-brick/5'
							: 'border-ink/20 bg-sand/20 hover:border-brick/60 hover:bg-sand/35'}"
					>
						<div class="mb-3 rounded-full bg-cream p-3 text-brick shadow-xs">
							<UploadCloud size={32} />
						</div>
						<h3 class="font-serif text-sm font-bold text-ink sm:text-base">
							Tarik & letakkan berkas naskah buku di sini
						</h3>
						<p class="mt-1 max-w-md text-xs text-ink-muted">
							Sistem secara otomatis membaca struktur berkas dan <strong
								>mengisi formulir metadata</strong
							> (judul, penulis, ISBN, halaman, daftar isi, dll).
						</p>

						<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
							<span
								class="rounded-xs border border-ink/10 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-ink"
							>
								PDF Document (.pdf)
							</span>
							<span
								class="rounded-xs border border-ink/10 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-ink"
							>
								Word OpenXML (.docx)
							</span>
							<span
								class="rounded-xs border border-ink/10 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-ink"
							>
								Digital EPUB (.epub)
							</span>
						</div>

						<label
							class="focus-library mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-colors hover:bg-brick/90 sm:text-sm"
						>
							<FileText size={16} />
							<span>Pilih Berkas dari Perangkat</span>
							<input
								type="file"
								accept=".pdf,.docx,.doc,.epub"
								onchange={handleFileSelect}
								class="sr-only"
							/>
						</label>
					</div>
				{:else}
					<!-- File Selected / Processing State -->
					<div class="rounded-lg border border-ink/15 bg-sand/25 p-5">
						<div class="flex items-start justify-between gap-4">
							<div class="flex items-center gap-3">
								<div class="rounded-md bg-brick p-2.5 text-cream shadow-xs">
									<FileText size={24} />
								</div>
								<div>
									<h4 class="font-serif text-sm font-bold text-ink sm:text-base">
										{selectedFile.name}
									</h4>
									<p class="font-mono text-xs text-ink-muted">
										{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull;
										<span class="font-semibold text-brick uppercase">{fileType}</span>
									</p>
								</div>
							</div>
							<button
								type="button"
								onclick={resetUploadedFile}
								class="focus-library rounded-md border border-ink/15 bg-white px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-brick hover:text-brick"
							>
								Ganti Berkas
							</button>
						</div>

						<!-- Live Progress Bar -->
						{#if isProcessing}
							<div class="mt-4 space-y-1.5">
								<div class="flex justify-between text-xs font-semibold text-ink">
									<span class="flex items-center gap-1.5">
										<RefreshCw size={12} class="animate-spin text-brick" />
										Membaca berkas & mengekstrak metadata otomatis...
									</span>
									<span class="font-mono">{uploadProgress}%</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-sand/50">
									<div
										class="h-full bg-brick transition-all duration-300"
										style="width: {uploadProgress}%"
									></div>
								</div>
							</div>
						{/if}

						<!-- Auto-Filled Summary Banner -->
						{#if extractionSuccess && autoFilledFields.length > 0}
							<div
								class="animate-in fade-in mt-4 rounded-md border border-emerald-300 bg-emerald-50/80 p-4 text-xs text-emerald-950 sm:text-sm"
							>
								<div class="flex items-start gap-2.5">
									<Sparkles size={18} class="mt-0.5 shrink-0 text-emerald-600" />
									<div class="flex-1 space-y-1.5">
										<p class="font-bold text-emerald-900">
											✨ Berhasil Diekstrak Otomatis ({autoFilledFields.length} Atribut Terisi)
										</p>
										<p class="text-xs text-emerald-800">
											Formulir di bawah telah diisi langsung dari data naskah berkas Anda. Anda
											dapat memeriksa atau menyuntingnya kapan saja.
										</p>
										<div class="mt-2 flex flex-wrap gap-1.5">
											{#each autoFilledFields as field (field)}
												<span
													class="inline-flex items-center gap-1 rounded-xs bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-900"
												>
													<Check size={11} class="text-emerald-700" />
													{field}
												</span>
											{/each}
										</div>

										{#if extractionLogs.length > 0}
											<details class="mt-2.5 text-xs text-emerald-900">
												<summary class="cursor-pointer font-semibold hover:underline">
													Lihat detail analisis struktur berkas ({extractionLogs.length} catatan)
												</summary>
												<ul
													class="mt-1.5 space-y-1 rounded bg-emerald-100/60 p-2 font-mono text-[11px]"
												>
													{#each extractionLogs as log, lIdx (lIdx)}
														<li>&bull; {log}</li>
													{/each}
												</ul>
											</details>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Section 2: Metadata Bibliografis Utama -->
			<div
				class="rounded-lg border border-ink/15 bg-white/70 p-6 shadow-xs backdrop-blur-xs sm:p-7"
			>
				<div class="mb-5 border-b border-ink/10 pb-3">
					<h2 class="font-serif text-base font-bold text-ink">Informasi Bibliografis Utama</h2>
					<p class="text-xs text-ink-muted">
						Identitas katalog resmi naskah buku perpustakaan digital
					</p>
				</div>

				<div class="space-y-4">
					<!-- Judul Lengkap -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<label for="book-title" class="text-xs font-bold text-ink sm:text-sm">
								Judul Lengkap Naskah <span class="text-brick">*</span>
							</label>
							{#if autoFilledFields.includes('Judul Naskah')}
								<span
									class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700"
								>
									<Check size={11} /> Terisi otomatis
								</span>
							{/if}
						</div>
						<input
							id="book-title"
							type="text"
							bind:value={title}
							required
							placeholder="Contoh: Metodologi Penelitian Pendidikan Matematika dan Sains"
							class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
						/>
					</div>

					<!-- Penulis & Penerbit -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<div class="mb-1 flex items-center justify-between">
								<label for="book-author" class="text-xs font-bold text-ink sm:text-sm">
									Penulis / Pengarang <span class="text-brick">*</span>
								</label>
								{#if autoFilledFields.includes('Penulis')}
									<span
										class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700"
									>
										<Check size={11} /> Terisi otomatis
									</span>
								{/if}
							</div>
							<input
								id="book-author"
								type="text"
								bind:value={author}
								required
								placeholder="Nama penulis beserta gelar akademik"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>

						<div>
							<label for="book-publisher" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Penerbit
							</label>
							<input
								id="book-publisher"
								type="text"
								bind:value={publisher}
								list="publisher-list"
								placeholder="UMKO Press"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
							<datalist id="publisher-list">
								{#each data.existingPublishers as pub (pub)}
									<option value={pub}></option>
								{/each}
							</datalist>
						</div>
					</div>

					<!-- Tahun, ISBN, Edisi, Halaman -->
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div>
							<label for="book-year" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Tahun Terbit
							</label>
							<input
								id="book-year"
								type="number"
								bind:value={year}
								min="1900"
								max="2035"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 font-mono text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>

						<div>
							<label for="book-isbn" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Nomor ISBN
							</label>
							<input
								id="book-isbn"
								type="text"
								bind:value={isbn}
								placeholder="978-602-xxx-xxx-x"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 font-mono text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>

						<div>
							<label for="book-edition" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Edisi / Cetakan
							</label>
							<input
								id="book-edition"
								type="text"
								bind:value={edition}
								placeholder="Edisi Pertama"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>

						<div>
							<label for="book-pages" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Jumlah Hlm
							</label>
							<input
								id="book-pages"
								type="number"
								bind:value={pages}
								min="1"
								placeholder="340"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 font-mono text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>
					</div>

					<!-- Bahasa -->
					<div>
						<label for="book-lang" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
							Bahasa Naskah
						</label>
						<select
							id="book-lang"
							bind:value={language}
							class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
						>
							<option value="Bahasa Indonesia">Bahasa Indonesia</option>
							<option value="Bahasa Inggris">Bahasa Inggris (English)</option>
							<option value="Bahasa Arab">Bahasa Arab (العربية)</option>
							<option value="Dwibahasa">Dwibahasa (Bilingual)</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Section 3: Klasifikasi Perpustakaan (DDC & Rak) -->
			<div
				class="rounded-lg border border-ink/15 bg-white/70 p-6 shadow-xs backdrop-blur-xs sm:p-7"
			>
				<div
					class="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3"
				>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="font-serif text-base font-bold text-ink">
								Klasifikasi Perpustakaan & Rak
							</h2>
							{#if autoFilledFields.includes('Klasifikasi DDC') || autoFilledFields.includes('Call Number DDC')}
								<span
									class="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
								>
									<CheckCircle2 size={12} />
									Otomatis DDC & Kategori
								</span>
							{/if}
						</div>
						<p class="text-xs text-ink-muted">
							Sistem pengelompokan standar Dewey Decimal Classification (DDC)
						</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<!-- Divisi Utama DDC -->
						<div>
							<label for="book-ddc" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Divisi Utama DDC
							</label>
							<select
								id="book-ddc"
								value={ddcCode}
								onchange={(e) => onDdcChange((e.target as HTMLSelectElement).value)}
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							>
								{#each data.ddcTree as node (node.code)}
									<option value={node.code}>
										{node.code} &mdash; {node.name}
									</option>
								{/each}
							</select>
						</div>

						<!-- Nomor Klasifikasi Presisi (Call Number) -->
						<div>
							<label for="book-class" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
								Nomor Klasifikasi Presisi (Call Number)
							</label>
							<input
								id="book-class"
								type="text"
								bind:value={classification}
								placeholder="Contoh: 370.7 atau 297.6"
								class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 font-mono text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
						</div>
					</div>

					<!-- Kategori Rak -->
					<div>
						<label for="book-cat" class="mb-1 block text-xs font-bold text-ink sm:text-sm">
							Kategori Rak Digital
						</label>
						<select
							id="book-cat"
							value={category}
							onchange={(e) => onCategoryChange((e.target as HTMLSelectElement).value)}
							class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
						>
							{#each data.categories as cat (cat.code)}
								<option value={cat.name}>{cat.name} ({cat.code})</option>
							{/each}
						</select>
					</div>

					<!-- Label / Kata Kunci (Tags) -->
					<div>
						<div class="mb-1 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<label for="tag-input-field" class="text-xs font-bold text-ink sm:text-sm">
									Kata Kunci & Label (Tags)
								</label>
								{#if autoFilledFields.includes('Kata Kunci')}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
									>
										<CheckCircle2 size={11} />
										Otomatis
									</span>
								{/if}
							</div>
							<button
								type="button"
								onclick={generateClientSmartTags}
								class="inline-flex items-center gap-1 text-[11px] font-semibold text-brick transition-colors hover:text-brick-dark hover:underline"
								title="Rekomendasikan label otomatis berdasarkan judul dan bab"
							>
								<Sparkles size={12} />
								<span>Sarankan Label Otomatis</span>
							</button>
						</div>
						<div class="flex items-center gap-2">
							<input
								id="tag-input-field"
								type="text"
								bind:value={tagInput}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addTag();
									}
								}}
								placeholder="Ketik label lalu tekan Enter..."
								class="flex-1 rounded-md border border-ink/20 bg-white px-3.5 py-1.5 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
							/>
							<button
								type="button"
								onclick={addTag}
								class="focus-library rounded-md border border-ink/20 bg-sand/40 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/70"
							>
								Tambah
							</button>
						</div>

						<div class="mt-2.5 flex flex-wrap gap-1.5">
							{#each tags as tag (tag)}
								<span
									class="inline-flex items-center gap-1.5 rounded-sm bg-sand/60 px-2 py-0.5 text-xs font-medium text-ink"
								>
									#{tag}
									<button
										type="button"
										onclick={() => removeTag(tag)}
										class="text-ink-muted hover:text-brick"
									>
										&times;
									</button>
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Section 4: Daftar Isi (Table of Contents) -->
			<div
				class="rounded-lg border border-ink/15 bg-white/70 p-6 shadow-xs backdrop-blur-xs sm:p-7"
			>
				<div class="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
					<div>
						<h2 class="font-serif text-base font-bold text-ink">Daftar Isi Naskah (TOC)</h2>
						<p class="text-xs text-ink-muted">
							Struktur bab dan penomoran halaman untuk pembaca digital
						</p>
					</div>
					<button
						type="button"
						onclick={addTocRow}
						class="focus-library flex items-center gap-1 rounded-sm border border-ink/20 bg-sand/40 px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-sand/70"
					>
						<Plus size={13} />
						<span>Tambah Bab</span>
					</button>
				</div>

				<div class="space-y-2">
					{#each tocItems as item, idx (idx)}
						<div class="flex items-center gap-2">
							<span class="w-6 shrink-0 text-right font-mono text-xs text-ink-muted">
								{idx + 1}.
							</span>
							<input
								type="text"
								bind:value={item.title}
								placeholder="Judul Bab / Bagian"
								class="flex-1 rounded-md border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
							<div class="flex shrink-0 items-center gap-1">
								<span class="font-mono text-xs text-ink-muted">Hlm.</span>
								<input
									type="number"
									bind:value={item.page}
									min="1"
									class="w-16 rounded-md border border-ink/20 bg-white px-2 py-1.5 text-center font-mono text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
								/>
							</div>
							{#if tocItems.length > 1}
								<button
									type="button"
									onclick={() => removeTocRow(idx)}
									class="focus-library rounded-md p-1.5 text-ink-muted transition-colors hover:bg-brick/10 hover:text-brick"
									title="Hapus Bab"
								>
									<Trash2 size={14} />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Section 5: Sinopsis / Abstrak Naskah -->
			<div
				class="rounded-lg border border-ink/15 bg-white/70 p-6 shadow-xs backdrop-blur-xs sm:p-7"
			>
				<div
					class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3"
				>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="font-serif text-base font-bold text-ink">Sinopsis / Abstrak Naskah</h2>
							{#if autoFilledFields.includes('Sinopsis / Abstrak')}
								<span
									class="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
								>
									<CheckCircle2 size={12} />
									Otomatis Terisi
								</span>
							{/if}
						</div>
						<p class="text-xs text-ink-muted">
							Ringkasan isi, tujuan pembelajaran, dan ruang lingkup kajian buku
						</p>
					</div>

					<button
						type="button"
						onclick={generateClientSmartSynopsis}
						class="focus-library flex items-center gap-1 rounded-md border border-ink/20 bg-sand/40 px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-sand/70"
						title="Hasilkan sinopsis terstruktur berdasarkan naskah"
					>
						<Sparkles size={13} class="text-brick" />
						<span>Hasilkan Sinopsis Cerdas</span>
					</button>
				</div>

				<div>
					<textarea
						bind:value={synopsis}
						rows="5"
						placeholder="Tuliskan ringkasan sinopsis atau abstrak naskah buku ini..."
						class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2.5 text-xs text-ink shadow-xs transition-colors focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
					></textarea>
					<div class="mt-1 flex justify-between text-[11px] text-ink-muted">
						<span>Dapat diedit kapan saja setelah penerbitan</span>
						<span>{synopsis.length} karakter</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Sticky Live Preview & Action Card (4 cols) -->
		<div class="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
			<!-- Live Book Visual Preview -->
			<div class="rounded-lg border border-ink/15 bg-white/80 p-5 shadow-sm backdrop-blur-xs">
				<div class="mb-4 flex items-center justify-between border-b border-ink/10 pb-2.5">
					<span
						class="inline-flex items-center gap-1 font-mono text-xs font-bold text-brick uppercase"
					>
						<BookOpen size={14} />
						Pratinjau Sampul Naskah
					</span>
					<span class="font-mono text-xs text-ink-muted uppercase">{fileType}</span>
				</div>

				<!-- Book Spine & Cover Canvas -->
				<div
					class="flex flex-col items-center justify-center rounded-md border border-ink/10 bg-sand/20 py-6"
				>
					<BookCover
						title={title || 'Judul Naskah Belum Diisi'}
						author={author || 'Nama Penulis'}
						src={coverUrl}
						classification={classification || '370'}
						{isFeatured}
						size="lg"
						class="w-44 shadow-lg transition-transform hover:scale-102"
					/>
				</div>

				<!-- Cover Mode Controls (Lembar 1 / Tipografi / Kustom) -->
				<div class="mt-4 border-t border-ink/10 pt-3">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-bold text-ink">Sumber Sampul Naskah</span>
						{#if isExtractingCover}
							<span class="inline-flex items-center gap-1 font-mono text-[11px] text-brick">
								<RefreshCw size={12} class="animate-spin" />
								Mengekstrak lembar 1...
							</span>
						{/if}
					</div>

					<!-- Segmented 3-Way Tabs -->
					<div class="grid grid-cols-3 gap-1 rounded-lg border border-ink/15 bg-sand/20 p-1">
						<button
							type="button"
							onclick={() => selectCoverSource('page1')}
							disabled={!extractedPageCoverUrl}
							class="flex flex-col items-center justify-center rounded-md px-1.5 py-2 text-center transition-all {coverSource ===
							'page1'
								? 'bg-white font-bold text-brick shadow-xs'
								: extractedPageCoverUrl
									? 'text-ink-muted hover:bg-white/50 hover:text-ink'
									: 'cursor-not-allowed text-ink-muted opacity-40'}"
							title={extractedPageCoverUrl
								? 'Gunakan gambar dari lembar pertama naskah'
								: 'Lembar pertama belum terdeteksi dari berkas'}
						>
							<span class="text-xs font-semibold">Lembar 1</span>
							<span class="text-[10px] opacity-80">
								{extractedPageCoverUrl ? 'Otomatis' : 'Tidak Ada'}
							</span>
						</button>

						<button
							type="button"
							onclick={() => selectCoverSource('typography')}
							class="flex flex-col items-center justify-center rounded-md px-1.5 py-2 text-center transition-all {coverSource ===
							'typography'
								? 'bg-white font-bold text-brick shadow-xs'
								: 'text-ink-muted hover:bg-white/50 hover:text-ink'}"
							title="Gunakan desain sampul tipografi resmi UMKO"
						>
							<span class="text-xs font-semibold">Tipografi</span>
							<span class="text-[10px] opacity-80">Resmi UMKO</span>
						</button>

						<button
							type="button"
							onclick={() => selectCoverSource('custom')}
							class="flex flex-col items-center justify-center rounded-md px-1.5 py-2 text-center transition-all {coverSource ===
							'custom'
								? 'bg-white font-bold text-brick shadow-xs'
								: 'text-ink-muted hover:bg-white/50 hover:text-ink'}"
							title="Unggah berkas sampul grafis sendiri"
						>
							<span class="text-xs font-semibold">Kustom</span>
							<span class="text-[10px] opacity-80">
								{customCoverUrl ? 'Terunggah' : 'Pilih Berkas'}
							</span>
						</button>
					</div>

					<!-- Contextual Explanations & Action Based on Active Mode -->
					<div class="mt-3">
						{#if coverSource === 'page1'}
							<div
								class="rounded-md border border-emerald-600/20 bg-emerald-50/60 p-2.5 text-xs text-emerald-900"
							>
								<div class="flex items-center gap-1.5 font-semibold">
									<CheckCircle2 size={13} class="text-emerald-700" />
									<span>Sampul Halaman Pertama Terpasang</span>
								</div>
								<p class="mt-0.5 text-[11px] text-emerald-800">
									Sistem mendeteksi dan merender lembar muka dari naskah digital secara otomatis.
								</p>
							</div>
						{:else if coverSource === 'typography'}
							<div class="rounded-md border border-ink/10 bg-sand/30 p-2.5 text-xs text-ink">
								<div class="flex items-center gap-1.5 font-semibold text-brick">
									<Sparkles size={13} />
									<span>Standar Tipografi Perpustakaan UMKO</span>
								</div>
								<p class="mt-0.5 text-[11px] text-ink-muted">
									Sampul disajikan elegan dengan warna khas universitas, nomor klasifikasi DDC, dan
									ornamen perpustakaan resmi tanpa perlu mengunggah gambar.
								</p>
							</div>
						{:else if coverSource === 'custom'}
							<div class="space-y-2">
								<label
									class="focus-library flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-ink/20 bg-sand/30 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-sand/60"
								>
									{#if isUploadingCover}
										<RefreshCw size={14} class="animate-spin text-brick" />
										<span>Mengunggah Sampul...</span>
									{:else}
										<ImageIcon size={14} />
										<span
											>{customCoverUrl
												? 'Ganti Berkas Sampul'
												: 'Unggah Sampul Sendiri (JPG/PNG/WebP)'}</span
										>
									{/if}
									<input
										id="cover-file-input"
										type="file"
										accept="image/jpeg,image/png,image/webp,image/avif"
										onchange={handleCoverSelected}
										class="sr-only"
									/>
								</label>
								<p class="text-[11px] text-ink-muted">
									Mendukung JPG, PNG, WebP, AVIF hingga 10MB. Disarankan rasio 1:1.4 atau standar
									buku A5/B5.
								</p>
							</div>
						{/if}

						{#if selectedFile && !extractedPageCoverUrl && !isExtractingCover}
							<div
								class="mt-2.5 flex items-start gap-1.5 rounded-md border border-sand-dark/40 bg-sand/20 p-2 text-[11px] text-ink-muted"
							>
								<AlertCircle size={13} class="mt-0.5 shrink-0 text-terracotta" />
								<span>
									Lembar pertama naskah tidak menghasilkan gambar sampul. Mode <strong
										>Tipografi Resmi UMKO</strong
									> otomatis diaktifkan untuk memastikan tampilan buku tetap rapi.
								</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Metadata Completeness Meter -->
			<div class="rounded-lg border border-ink/15 bg-white/80 p-5 shadow-sm backdrop-blur-xs">
				<div class="flex items-center justify-between">
					<h3 class="font-serif text-sm font-bold text-ink">Kelengkapan Metadata</h3>
					<span class="font-mono text-sm font-bold text-brick">{completenessScore}%</span>
				</div>

				<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand/40">
					<div
						class="h-full bg-brick transition-all duration-300"
						style="width: {completenessScore}%"
					></div>
				</div>

				<ul class="mt-4 space-y-2 text-xs text-ink">
					<li class="flex items-center gap-2">
						{#if uploadedFilePath || selectedFile}
							<CheckCircle2 size={15} class="text-emerald-600" />
						{:else}
							<div class="h-3.5 w-3.5 rounded-full border border-ink/30"></div>
						{/if}
						<span class={uploadedFilePath ? 'font-medium' : 'text-ink-muted'}>
							Berkas Naskah Digital Terunggah
						</span>
					</li>
					<li class="flex items-center gap-2">
						{#if title.trim() && author.trim()}
							<CheckCircle2 size={15} class="text-emerald-600" />
						{:else}
							<div class="h-3.5 w-3.5 rounded-full border border-ink/30"></div>
						{/if}
						<span class={title && author ? 'font-medium' : 'text-ink-muted'}>
							Judul Naskah & Penulis Terisi
						</span>
					</li>
					<li class="flex items-center gap-2">
						{#if ddcCode && classification}
							<CheckCircle2 size={15} class="text-emerald-600" />
						{:else}
							<div class="h-3.5 w-3.5 rounded-full border border-ink/30"></div>
						{/if}
						<span class="font-medium">Klasifikasi DDC & Nomor Panggil</span>
					</li>
					<li class="flex items-center gap-2">
						{#if isbn.trim()}
							<CheckCircle2 size={15} class="text-emerald-600" />
						{:else}
							<div class="h-3.5 w-3.5 rounded-full border border-ink/30"></div>
						{/if}
						<span class={isbn ? 'font-medium' : 'text-ink-muted'}>
							Nomor ISBN {isbn ? `(${isbn})` : '(Opsional)'}
						</span>
					</li>
					<li class="flex items-center gap-2">
						{#if coverSource === 'page1' && coverUrl}
							<CheckCircle2 size={15} class="text-emerald-600" />
							<span class="font-medium text-emerald-800">Sampul Lembar 1 Naskah Terpasang</span>
						{:else if coverSource === 'custom' && coverUrl}
							<CheckCircle2 size={15} class="text-emerald-600" />
							<span class="font-medium text-emerald-800">Sampul Grafis Kustom Terpasang</span>
						{:else}
							<CheckCircle2 size={15} class="text-sand-dark" />
							<span class="font-medium">Sampul Tipografi Standar UMKO (Aktif)</span>
						{/if}
					</li>
				</ul>
			</div>

			<!-- Pustakawan Curation & Publication Options -->
			<div class="rounded-lg border border-ink/15 bg-white/80 p-5 shadow-sm backdrop-blur-xs">
				<h3 class="mb-3 font-serif text-sm font-bold text-ink">Pengaturan Publikasi</h3>

				<label class="flex cursor-pointer items-start gap-3">
					<input
						type="checkbox"
						bind:checked={isFeatured}
						class="mt-0.5 h-4 w-4 rounded-xs border-ink/30 text-brick focus:ring-brick"
					/>
					<div>
						<span class="text-xs font-bold text-ink">Pilihan Pustakawan (Rekomendasi Utama)</span>
						<p class="text-[11px] text-ink-muted">
							Tampilkan naskah ini pada sorotan kurasi pustakawan di beranda perpustakaan
						</p>
					</div>
				</label>
			</div>

			<!-- Bottom Submit Actions -->
			<div class="space-y-2">
				<button
					type="submit"
					disabled={isSubmitting || isProcessing}
					class="focus-library flex w-full items-center justify-center gap-2 rounded-md bg-brick py-3 text-sm font-bold text-cream shadow-md transition-all hover:bg-brick/90 disabled:opacity-50"
				>
					{#if isSubmitting}
						<RefreshCw size={16} class="animate-spin" />
						<span>Menerbitkan Naskah...</span>
					{:else}
						<Check size={18} />
						<span>Simpan & Publikasikan Naskah</span>
					{/if}
				</button>

				<a
					href="/admin/buku"
					class="focus-library flex w-full items-center justify-center rounded-md border border-ink/20 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sand/30 hover:text-ink"
				>
					Batal & Kembali ke Katalog
				</a>
			</div>
		</div>
	</form>
</div>
