import { enhancedImages } from '@sveltejs/enhanced-img';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		watch: {
			ignored: [
				'**/storage/**',
				'**/storage/**/*',
				'**/.git/**',
				/[\\/]storage[\\/]/,
				/[\\/]\.git[\\/]/,
				(path: string) =>
					typeof path === 'string' && (path.includes('storage') || path.includes('.git'))
			]
		},
		fs: {
			deny: ['**/storage/**']
		}
	},
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
