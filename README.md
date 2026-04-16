Text Reveal

## GitHub Pages Deployment

This project can be deployed to GitHub Pages automatically using GitHub Actions.

### How to Enable

1. Push your code to the `main` or `master` branch on GitHub.
2. Go to your repository's **Settings > Pages**.
3. Set the source to **GitHub Actions**.
4. After a successful push, your site will be available at:
   `https://<your-username>.github.io/<your-repo>/`

### Workflow File
The deployment workflow is defined in `.github/workflows/gh-pages.yml`.

No further configuration is needed for a static site.
