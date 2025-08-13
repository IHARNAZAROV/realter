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
    *   `critical` for inlining critical CSS
    *   `purgecss` for removing unused CSS

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

The project includes scripts to optimize the CSS for better performance.

*   **Generate Critical CSS:** To extract and inline the critical-path CSS, run the following command:
    ```bash
    npm run build-critical
    ```
    This will generate a `index-critical.html` file with the critical CSS inlined.

*   **Purge Unused CSS:** To remove unused CSS from the stylesheets, run:
    ```bash
    npm run purge-css
    ```
    This will create a `css/style-purged.css` file.

## Project Structure

*   `index.html`: The main HTML file for the website.
*   `css/`: Contains the CSS files.
    *   `style.css`: The main stylesheet.
    *   `style-purged.css`: The optimized stylesheet.
*   `js/`: Contains the JavaScript files.
*   `images/`: Contains all the images used in the website.
*   `node_modules/`: Contains the installed Node.js modules.
*   `package.json`: Defines the project's dependencies and scripts.
*   `build-critical.js`: The script for generating critical CSS.
*   `build-purge.js`: The script for purging unused CSS.
*   `README.md`: This file.
