import esbuild from 'esbuild';
import { promises as fs } from 'fs';

const scripts = [
  'js/jquery-1.12.4.min.js',
  'js/popper.min.js',
  'js/bootstrap.min.js',
  'js/magnific-popup.min.js',
  'js/waypoints.min.js',
  'js/counterup.min.js',
  'js/waypoints-sticky.min.js',
  'js/isotope.pkgd.min.js',
  'js/owl.carousel.min.js',
  'js/jquery.owl-filter.js',
  'js/stellar.min.js',
  'js/jquery.bootstrap-touchspin.js',
  'js/custom.js',
  'js/jquery.bgscroll.js',
  'js/theia-sticky-sidebar.js',
  'js/lazysizes.min.js',
  'plugins/revolution/revolution/js/jquery.themepunch.tools.min.js',
  'plugins/revolution/revolution/js/jquery.themepunch.revolution.min.js',
  'plugins/revolution/revolution/js/extensions/revolution-plugin.js',
  'js/rev-script-1.js'
];

async function concatFiles(files, dest) {
    let content = '';
    for (const file of files) {
        content += await fs.readFile(file, 'utf-8');
        content += '\n'; // Add a newline between files
    }
    await fs.writeFile(dest, content);
}

async function build() {
    try {
        console.log('Starting JavaScript bundling...');

        // esbuild doesn't guarantee order for multiple entry points,
        // so we first concatenate them into a temporary file.
        const tempFile = 'js/temp-bundle.js';
        await concatFiles(scripts, tempFile);

        await esbuild.build({
            entryPoints: [tempFile],
            bundle: false, // We've already "bundled" by concatenation
            minify: true,
            outfile: 'js/bundle.min.js',
            allowOverwrite: true,
        });

        // Clean up the temporary file
        await fs.unlink(tempFile);

        console.log('JavaScript bundled and minified successfully to js/bundle.min.js!');
    } catch (err) {
        console.error('An error occurred during the JS build process:', err);
        process.exit(1);
    }
}

build();
