import { defineConfig } from 'vite';

export default defineConfig({
	base: '/countdown-app/',
	server: {
		host: '0.0.0.0',
	},
	build: {
		outDir: 'docs',
	},
});