Text Reveal

## GitHub Pages Deployment

This project can be deployed to GitHub Pages using an npm script.

### How to Deploy

1. Make sure you have pushed your latest changes to GitHub.
2. Run the following command:

   npm run deploy

3. Go to your repository's **Settings > Pages**.
4. Set the source to the `gh-pages` branch.
5. Your site will be available at:
   `https://<your-username>.github.io/<your-repo>/`

### npm Script
The deployment script uses the [gh-pages](https://www.npmjs.com/package/gh-pages) package to publish the site.

No further configuration is needed for a static site.
