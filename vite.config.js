// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Определяем все HTML-файлы как точки входа
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        faq: resolve(__dirname, 'faq.html'),
        objects: resolve(__dirname, 'objects.html'),
        blog: resolve(__dirname, 'blog.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
      // Здесь указываем внешние скрипты, которые Vite не должен бандлить
      external: [
        '/js/jquery-1.12.4.min.js',
        '/js/popper.min.js',
        '/js/bootstrap.min.js',
        '/js/magnific-popup.min.js',
        '/js/waypoints.min.js',
        '/js/counterup.min.js',
        '/js/waypoints-sticky.min.js',
        '/js/isotope.pkgd.min.js',
        '/js/owl.carousel.min.js',
        '/js/jquery.owl-filter.js',
        '/js/stellar.min.js',
      ],
    },
  },
});