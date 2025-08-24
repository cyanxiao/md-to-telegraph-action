# Markdown to Telegraph Action

This README itself is a demo for this action. The [Project GitHub Repo](https://github.com/cyanxiao/md-to-telegraph-action) is in sync with the [Telegraph Page](https://telegra.ph/Markdown-to-Telegraph-Action-08-23).

`md-to-telegraph-action` is a GitHub action that automatically converts markdown files in your repository to pages on [Telegraph](https://telegra.ph/). It is a convenient way to host your documentation on [Telegraph](https://telegra.ph/) without the hassle of setting up a server.

Check it out in Marketplace: [Markdown to Telegraph Action](https://github.com/marketplace/actions/markdown-to-telegraph)

## Features

- 🚀 Converts markdown files to Telegraph pages automatically
- 📝 Supports most markdown syntax (headers, bold, italic, links, code blocks, etc.)
- 🔗 **Resolves internal markdown links** between files automatically
- 📖 Automatically extracts page titles from H1 headers
- 🔄 Tracks file changes and only updates modified files
- 📋 Maintains a mapping file of all created pages
- ⚙️ Configurable file patterns for inclusion/exclusion
- 🎯 Uses existing Telegraph account or creates a new one
- 🔀 **One Entry Mode**: Automatically updates repository homepage URL with Telegraph URL when only one page is created
- 🔄 **Page Replacement**: Reuse existing Telegraph pages instead of creating new ones (maintains same URLs)

## Quick Start

```yaml
name: Convert Docs to Telegraph

on:
  push:
    branches: [main]
    paths: ["docs/**/*.md"]

jobs:
  convert-to-telegraph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Cache Telegraph mappings
        uses: actions/cache@v3
        with:
          path: telegraph-pages.json
          key: telegraph-mappings-${{ hashFiles('docs/**/*.md') }}
      - uses: cyanxiao/md-to-telegraph-action@release
        with:
          account-name: "My Docs Site"
          author-name: "Documentation Team"
          include-patterns: "docs/**/*.md"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Documentation

For detailed usage instructions, configuration options, and advanced features, see:

- [Usage Guide](docs/usage-guide.md) - Complete configuration examples and input/output reference
- [Features](docs/features.md) - Detailed documentation for One Entry Mode, Page Replacement, and Internal Link Resolution
- [Development](docs/development.md) - Setup, testing, and contribution guidelines
