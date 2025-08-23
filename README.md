# Markdown to Telegraph Action

A GitHub Action that automatically converts markdown files in your repository to pages on [Telegraph](https://telegra.ph/).

## Features

- 🚀 Converts markdown files to Telegraph pages automatically
- 📝 Supports most markdown syntax (headers, bold, italic, links, code blocks, etc.)
- 🔗 **Resolves internal markdown links** between files automatically
- 📖 Automatically extracts page titles from H1 headers
- 🔄 Tracks file changes and only updates modified files
- 📋 Maintains a mapping file of all created pages
- ⚙️ Configurable file patterns for inclusion/exclusion
- 🎯 Uses existing Telegraph account or creates a new one
- 🔀 **One Entry Mode**: Automatically updates repository description with Telegraph URL when only one page is created
- 🔄 **Page Replacement**: Reuse existing Telegraph pages instead of creating new ones (maintains same URLs)

## Usage

### Basic Example

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
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Convert markdown to Telegraph
        uses: cyanxiao/md-to-telegraph-action@release
        with:
          account-name: "My Docs Site"
          author-name: "Documentation Team"
          include-patterns: "docs/**/*.md,README.md"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Example

```yaml
jobs:
  convert-to-telegraph:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Convert markdown to Telegraph
        uses: cyanxiao/md-to-telegraph-action@release
        with:
          account-name: "My Project Docs"
          author-name: "Author"
          author-url: "https://github.com/{author}"
          include-patterns: "docs/**/*.md,guides/**/*.md,README.md"
          exclude-patterns: "node_modules/**,dist/**,draft/**"
          output-file: "my-telegraph-pages.json"
          telegraph-token: ${{ secrets.TELEGRAPH_TOKEN }}
          one-entry-mode: "true"
          replace-existing-pages: "true"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit updated mappings
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add my-telegraph-pages.json
          git diff --staged --quiet || git commit -m "Update Telegraph page mappings"
          git push
```

## Inputs

| Input                    | Description                                                 | Required | Default                  |
| ------------------------ | ----------------------------------------------------------- | -------- | ------------------------ |
| `account-name`           | Telegraph account short name                                | No       | `'GitHub Action'`        |
| `author-name`            | Author name for Telegraph pages                             | No       | `'GitHub Action'`        |
| `author-url`             | Author URL for Telegraph pages                              | No       | -                        |
| `include-patterns`       | Comma-separated glob patterns for files to include          | No       | `'**/*.md'`              |
| `exclude-patterns`       | Comma-separated glob patterns for files to exclude          | No       | `'node_modules/**'`      |
| `output-file`            | Output file to store page mappings                          | No       | `'telegraph-pages.json'` |
| `telegraph-token`        | Existing Telegraph access token                             | No       | -                        |
| `one-entry-mode`         | Update repository description when only one page is created | No       | `'false'`                |
| `replace-existing-pages` | Reuse existing Telegraph pages instead of creating new ones | No       | `'false'`                |

## Outputs

| Output          | Description                               |
| --------------- | ----------------------------------------- |
| `pages-created` | Number of Telegraph pages created/updated |
| `mapping-file`  | Path to the file containing page mappings |

## One Entry Mode

When enabled with `one-entry-mode: "true"`, this feature automatically updates your repository description with the Telegraph URL when exactly one markdown file is processed. This is perfect for single-page documentation repositories, personal profiles, or project showcases.

### How it works

1. **Enable the feature**: Set `one-entry-mode: "true"` in your workflow
2. **Single page detection**: When exactly one markdown file is processed, the action detects this scenario
3. **Repository update**: The GitHub repository description is automatically updated with the Telegraph page URL
4. **Permission handling**: Gracefully handles cases where the GitHub token lacks repository write permissions

### Example

```yaml
- name: Convert README to Telegraph
  uses: cyanxiao/md-to-telegraph-action@release
  with:
    account-name: "My Profile"
    author-name: "Your Name"
    include-patterns: "README.md"
    one-entry-mode: "true"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Result**: If only `README.md` is processed, your repository description will be automatically updated to point to the Telegraph page (e.g., `https://telegra.ph/My-Profile-12-15`).

### Requirements

- **GITHUB_TOKEN**: Must be provided via `env` for repository description updates
- The GitHub token must have `metadata: write` or `contents: write` permissions
- If permissions are insufficient, the action will show a warning but continue successfully
- Only works when exactly one markdown file is processed

## Page Replacement Mode

When enabled with `replace-existing-pages: "true"`, this feature prevents the creation of duplicate Telegraph pages by reusing existing pages with the same title. This is perfect for documentation that gets updated regularly, as it maintains consistent URLs for bookmarks and external links.

### How it works

1. **Enable the feature**: Set `replace-existing-pages: "true"` in your workflow
2. **Provide consistent token**: A `telegraph-token` is **required** for this feature to work
3. **Title matching**: The action searches for existing pages with matching titles
4. **Content replacement**: If a match is found, the existing page content is replaced
5. **URL preservation**: The Telegraph page URL remains the same (e.g., `https://telegra.ph/My-Guide-12-15`)

### Example

```yaml
- name: Update Documentation
  uses: cyanxiao/md-to-telegraph-action@release
  with:
    account-name: "Project Docs"
    author-name: "Documentation Team"
    telegraph-token: ${{ secrets.TELEGRAPH_TOKEN }}
    include-patterns: "docs/**/*.md"
    replace-existing-pages: "true"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Result**: Each time the action runs, it will update the existing Telegraph pages instead of creating new ones, preserving URLs and preventing duplicates.

### Requirements

- **Telegraph token is mandatory**: This feature requires a consistent `telegraph-token` to access your existing pages
- **Title-based matching**: Pages are matched by title (case-insensitive)
- **Account ownership**: You can only replace pages that belong to your Telegraph account

### Benefits

- 📌 **Consistent URLs**: Links to your documentation never break
- 🚫 **No duplicates**: Prevents accumulation of old versions
- 🔄 **Seamless updates**: Content gets refreshed while maintaining the same URL
- 📚 **Clean account**: Your Telegraph account stays organized

### Important Notes

- If no existing page with a matching title is found, a new page will be created
- The action will show clear logs indicating whether it's replacing or creating pages
- This feature works alongside the existing mapping file for tracking changes

## Internal Link Resolution

One of the key features of this action is **automatic internal link resolution**. When you have markdown files that link to each other, the action intelligently converts these internal links to point to the corresponding Telegraph pages.

### How it works

1. **First Pass**: All markdown files are converted to Telegraph pages
2. **Second Pass**: Internal links are resolved and pages are updated

### Example

If you have a file `docs/guide.md` with content like:

```markdown
# User Guide

See our [Getting Started](./getting-started.md) guide first.
Also check out the [API Reference](../api/reference.md).
```

The action will:

- Convert `./getting-started.md` → `https://telegra.ph/Getting-Started-12-15`
- Convert `../api/reference.md` → `https://telegra.ph/API-Reference-12-15`
- Update the Telegraph page with the resolved links

### Supported link formats

- Relative links: `./other.md`, `../folder/file.md`
- Links with fragments: `./other.md#section`
- Links to files in subdirectories: `subfolder/file.md`

## Telegraph Page Mapping

The action creates a JSON file (default: `telegraph-pages.json`) that maps your markdown files to Telegraph pages:

```json
[
  {
    "filePath": "docs/getting-started.md",
    "telegraphPath": "Getting-Started-12-15",
    "telegraphUrl": "https://telegra.ph/Getting-Started-12-15",
    "lastModified": "2023-12-15T10:30:00.000Z"
  }
]
```

## Markdown Support

The action supports most standard markdown features:

✅ **Supported:**

- Headers (H1-H6, converted to H3-H4 for Telegraph compatibility)
- **Automatic title extraction** from the first H1 header in each file
- Bold and italic text
- Links (including automatic internal link resolution)
- Code blocks and inline code
- Block quotes
- Lists (unordered and ordered)
- Line breaks and paragraphs

⚠️ **Limited Support:**

- Images (must be publicly accessible URLs)
- Tables (converted to plain text)

❌ **Not Supported:**

- Front matter (automatically stripped)
- Complex HTML
- Custom markdown extensions

## Development

### Setup

```bash
# Install dependencies
yarn install

# Build the action
yarn build

# Package for distribution
yarn package
```

### Testing

```bash
# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format
```
