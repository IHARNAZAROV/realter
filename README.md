# Project: Real Estate Agent Portfolio Website

This is a portfolio website for Olga Turko, a real estate agent based in Lida, Belarus. The website showcases her services, property listings, and client testimonials.

## Technologies Used

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript (ES6)
    *   jQuery
    *   Bootstrap
    *   Owl Carousel
    *   Magnific Popup
    *   lazysizes
*   **Build Tools:**
    *   Node.js
    *   npm
    *   `esbuild` for JavaScript bundling.

## Setup and Installation

1.  **Prerequisites:** Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

2.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

3.  **Navigate to the project directory:**
    ```bash
    cd <project-directory>
    ```

4.  **Install dependencies:**
    ```bash
    npm install
    ```

## Build Process

The project includes a build script to optimize CSS, bundle JavaScript, and self-host fonts.

*   **Run the build:** To perform all optimizations, run the following command:
    ```bash
    npm run build
    ```
    This will generate an `index-optimized.html` file in the root directory with all optimizations applied.

## Project Structure

*   `index.html`: The main source HTML file for the website.
*   `index-optimized.html`: The final, optimized HTML file.
*   `css/`: Contains the CSS files.
    *   `style-purged.css`: The optimized stylesheet.
*   `js/`: Contains the JavaScript files.
    *   `bundle.min.js`: The bundled and minified JavaScript.
*   `fonts/`: Contains self-hosted font files.
*   `webfonts/`: Contains self-hosted Font Awesome files.
*   `images/`: Contains all the images used in the website.
*   `node_modules/`: Contains the installed Node.js modules.
*   `package.json`: Defines the project's dependencies and scripts.
*   `build-critical.js`: The main build script that handles all optimizations.
*   `build-js.js`: The script for bundling JavaScript.
*   `README.md`: This file.
