# GitHub repositories are now mirror only

Due to recent changes in GitHub's direction, development has migrated to: https://git.ribas89.co.uk/

Have a issue/question? https://link.ribas89.co.uk/ask


# Markdown PDF Watcher (Docker)

This project provides a Dockerized service that **watches Markdown files**, **converts them to PDF**, and **serves the generated files via a static HTML page**.

The conversion process is configuration-driven and automatically re-runs whenever source files change.

---

## What it does

- Watches one or more Markdown files for changes
- Converts them to PDF based on a YAML configuration
- Applies a custom CSS stylesheet during PDF generation
- Writes generated PDFs to a public directory
- Serves the output via a static HTML page
- Runs entirely inside a Docker container

File watching is handled in real time; no manual rebuilds or restarts are required.

---

## Project structure (simplified)

```
.
├── build/
│   ├── Dockerfile
│   └── src/
│       └── backend/
│           └── index.js
├── config/
│   ├── pdfs.yml
│   └── styles.css
├── docs/
│   └── index.html
└── resumes/
    └── <markdown sources>
```

---

## Configuration

### `config/pdfs.yml`

Defines which Markdown files are watched and how PDFs are generated.

Each entry maps:
- a source Markdown file
- to an output PDF path

The service will **exit on startup** if this file is missing or contains no PDF definitions.

---

### `config/styles.css`

Custom CSS applied during PDF rendering.

Changes are picked up automatically without restarting the container.

---

## Docker Compose example

Sanitized example:

```yaml
profile:
  container_name: profile
  build:
    context: /path/to/project/build
  volumes:
    - /path/to/resumes:/resumes
    - /path/to/docs:/public
    - /path/to/config:/config
  restart: unless-stopped
```

---

## Volume expectations

| Host path           | Container path | Purpose                               |
|---------------------|----------------|---------------------------------------|
| `/path/to/resumes`  | `/resumes`     | Markdown source files                 |
| `/path/to/docs`     | `/public`      | Generated PDFs and static HTML        |
| `/path/to/config`   | `/config`      | PDF definitions and CSS configuration |

---

## Runtime behavior

- On startup, the service loads `/config/pdfs.yml`
- All configured Markdown files are watched using filesystem events
- When a file changes:
  - the corresponding PDF is regenerated
  - output is written to the public directory
- Errors are logged to stdout/stderr

---

## Requirements

- Docker
- Docker Compose

No external services are required at runtime.
