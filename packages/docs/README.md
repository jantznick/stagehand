# Stagehand Documentation

This package contains the developer documentation for Stagehand, built with [Docusaurus](https://docusaurus.io/).

## Development

### Local Development

From the root of the repository:

```bash
# Install dependencies (run from repo root)
npm install

# Start the docs development server
npm run dev:docs
```

The documentation will be available at: `http://localhost:3002`

### Docker Development

```bash
# From repo root - starts all services including docs
docker-compose up

# Or just the docs service
docker-compose up docs
```

The documentation will be available at: `http://localhost:3002`

## Production

### Building Static Site

```bash
# Build the static documentation site
npm run build:docs

# Serve the built site locally for testing
npm run serve:docs
```

### Docker Production

```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up docs
```

In production, the docs will be served at:
- Development: `http://localhost:3002`
- Production: `https://docs.yourdomain.com` (configure domain in `docusaurus.config.js`) or `http://localhost:3002` for local production testing

## Content Organization

The documentation is organized as follows:

```
docs/
├── index.md                    # Landing page
├── api-reference.md           # API overview
├── backend-architecture.md    # Backend architecture
├── frontend-architecture.md   # Frontend architecture
├── api/                       # API endpoint documentation
│   ├── auth.md
│   ├── organizations.md
│   └── ...
└── frontend/                  # Frontend documentation
    ├── components/            # Component docs
    ├── stores/               # Store docs
    ├── hooks.md
    ├── lib.md
    └── pages.md
```

## Configuration

### URL Configuration

The documentation URLs are configured in `docusaurus.config.js`:

- **Development**: Served at `http://localhost:3002`
- **Production**: Served at root domain (e.g., `docs.yourdomain.com`)

### Customization

- **Theme**: Modify `src/css/custom.css` for styling
- **Navigation**: Update `sidebars.js` for sidebar structure
- **Config**: Edit `docusaurus.config.js` for site settings

## Deployment Options

### Option 1: Subdomain (Recommended)

Configure DNS to point `docs.yourdomain.com` to your server, then:

1. Update `docusaurus.config.js` with your domain
2. Deploy using the production Docker setup
3. Set up reverse proxy (nginx/traefik) if needed

### Option 2: Path-based (Alternative)

To serve docs at `yourdomain.com/docs`:

1. Set `baseUrl: '/docs/'` in `docusaurus.config.js`
2. Configure your main nginx/reverse proxy to forward `/docs` to the docs container on port 3002

## Contributing

When updating documentation:

1. Edit the relevant `.md` files in the `docs/` directory
2. Test locally with `npm run dev:docs`
3. Update sidebar structure in `sidebars.js` if adding new pages
4. Commit changes alongside code changes

## Scripts

Available npm scripts:

- `npm run start` - Start development server
- `npm run build` - Build static site
- `npm run serve` - Serve built site locally
- `npm run clear` - Clear Docusaurus cache 