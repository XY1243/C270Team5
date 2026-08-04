# Event Finder App

Node.js/Express + EJS event discovery & RSVP platform, with MySQL storage,
Google Calendar sync, and email confirmations. Ships with Docker, a Jenkins
CI/CD pipeline, and Ansible playbooks for provisioning/deploying to AWS EC2.

## Prerequisites

- Node.js 20+
- MySQL 8 (or use the bundled `docker-compose.yml`)

## Setup

```
npm install
cp .env.example .env   # fill in real DB/JWT/Google/SMTP values
```

Create the database schema and seed data (against your local MySQL):

```
mysql -u root -p < src/db/schema.sql
mysql -u root -p < src/db/seed.sql
```

Run the app:

```
npm run dev     # nodemon, auto-reload
npm start       # production mode
```

The app listens on `PORT` from `.env` (default `3000`).

## Tests

```
npm test
```

Runs the Node.js built-in test runner (`node --test`) against `test/*.test.js`.
`test-db.js` in the repo root is a manual DB-connectivity script, not part of
the automated test suite.

## Docker

```
docker compose up -d --build
```

Builds the app image and starts it alongside a MySQL 8 container (schema/seed
SQL are auto-loaded on first boot). The app is reachable on `http://localhost:3000`.

## CI/CD

- **Jenkins** ([Jenkinsfile](Jenkinsfile)): checkout -> `docker build` -> run
  tests inside the built image -> Trivy vulnerability scan of the image
  (fails the build on HIGH/CRITICAL fixable CVEs). Owned by another team member.
- **Ansible** ([ansible/](ansible/README.md)): provisions the AWS EC2 host
  (Docker, firewall, Jenkins agent) and deploys the app via `docker compose`.
  `ansible/deploy.yml` is ready to be called as a Jenkins deploy stage — see
  [ansible/README.md](ansible/README.md) for the exact command and the Jenkins
  integration details.

## Project structure

```
app.js / server.js   # Express app entry point
src/
  config/            # env loading
  controllers/        # route handlers
  models/              # DB queries
  routes/               # Express routers
  middleware/           # auth, upload, error handling
  services/             # Google Calendar + email
  db/                    # schema.sql, seed.sql
views/                # EJS templates
public/               # static assets
ansible/              # EC2 provisioning + deployment playbooks
test/                 # automated tests (node:test)
```
