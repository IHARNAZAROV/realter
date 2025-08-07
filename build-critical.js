// build-critical.js

import { generate } from 'critical';
import { PurgeCSS } from 'purgecss';
import { promises as fs } from 'fs';
import purgecssConfig from './purgecss.config.js';

async function build() {
  try {
    // 1. Purge CSS
    console.log('Starting PurgeCSS...');
    const purgeCSSResult = await new PurgeCSS().purge(purgecssConfig);

    if (!purgeCSSResult || !purgeCSSResult.length || !purgeCSSResult[0].css) {
      throw new Error('PurgeCSS did not return any CSS.');
    }

    const purgedCss = purgeCSSResult[0].css;
    console.log('PurgeCSS completed successfully.');

    // 2. Generate Critical CSS using the purged CSS
    console.log('Generating critical CSS...');
    const options = {
      base: './',
      html: await fs.readFile('index.html', 'utf-8'), // Use index.html as source
      css: [purgedCss], // Use the purged CSS content directly
      inline: true,
      width: 1300,
      height: 900
    };

    let { html: criticalHtml } = await generate(options);

    // 3. Replace script tags with the bundle
    const scriptBlockRegex = /<!-- JAVASCRIPT  FILES ========================================= -->[\s\S]*?<!-- REVOLUTION SLIDER SCRIPT FILES -->[\s\S]*?<script src="js\/rev-script-1.js" defer><\/script>/;
    const replacement = '    <!-- JAVASCRIPT  FILES ========================================= -->\n    <script src="js/bundle.min.js" defer></script>';
    criticalHtml = criticalHtml.replace(scriptBlockRegex, replacement);

    // 4. Save the final optimized file
    await fs.writeFile('index-optimized.html', criticalHtml);
    console.log('Critical CSS and bundled JS reference successfully generated and saved to index-optimized.html!');

  } catch (err) {
    console.error('An error occurred during the build process:', err);
  }
}

build();