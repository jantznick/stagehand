# Stagehand - The Developer-First Application Security Platform

Stagehand is an Application Security Posture Management (ASPM) tool that serves as a rich **Developer Catalog** and a centralized **Security Findings Hub**. It's built to give engineering and security teams a unified, actionable view of their software assets and security posture.

---

## Quick Start: Local Development

Follow these steps to get the entire Stagehand platform running on your local machine.

### Prerequisites

*   [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
*   [Node.js](https://nodejs.org/) (v18 or higher) and npm

### 1. Set Up Environment Variables

First, create a local environment file by copying the example:

```bash
cp .env.example .env
```

Next, open the new `.env` file and generate the required secrets. Run the following commands and paste the output into the corresponding fields in the file.

```bash
# Generate a SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate an ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Important:** The `ENCRYPTION_KEY` is used to protect sensitive data. Do not change it after you have created data in your local database.

### 2. Install Dependencies

Install all project dependencies from the root directory:

```bash
npm install
```

### 3. Run the Application

Start all services (database, api, web) using Docker Compose:

```bash
docker-compose up --build
```

The services will be available at:
*   **Frontend UI:** `http://localhost:3000`
*   **Backend API:** `http://localhost:3001`
*   **Database:** Connect on port `5432`

The first time you run this, it will also create the initial database schema.

### 4. Stop the Application

To stop all services, press `Ctrl+C` in the terminal where `docker-compose` is running, and then run:
```bash
docker-compose down
```

---

## Available Scripts

From the project root, you can run the following commands:

*   `npm run dev`: Starts both the `api` and `web` services in development mode (without Docker).
*   `npm run build`: Builds all workspaces for production.
*   `npm run lint`: Lints all code in the project.
*   `npm run format`: Formats all code with Prettier.
*   `npm run prisma -- <command>`: Runs a Prisma command against the database (e.g., `npm run prisma -- db seed`).

---

## Project Structure

This project is a monorepo managed by npm workspaces. The main packages are:

*   `packages/api`: The Node.js/Express.js backend API.
*   `packages/web`: The React/Vite frontend application.
*   `packages/emails`: A collection of transactional email templates.

---

## In-Depth Documentation

For a deeper understanding of the project's architecture, conventions, and design, please refer to the documentation:

### Developer Guides

*   **[Backend Architecture](./developer-docs/backend-architecture.md):** A detailed guide to the API's structure, patterns, and conventions.
*   **[Frontend Architecture](./developer-docs/frontend-architecture.md):** A detailed guide to the web app's structure, state management, and component strategy.

### System Design & Features

*   **[High-Level Architecture](./docs/architecture.md):** An overview of the entire system, tenancy model, and core concepts.
*   **[Authentication Deep Dive](./docs/authentication.md):** A detailed explanation of the authentication and session management flow.
*   **[Testing Guide](./docs/testing-guide.md):** Information on the project's testing strategy.
