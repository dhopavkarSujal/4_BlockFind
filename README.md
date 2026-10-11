# BlockFind

## Lost and Found Asset Management System

BlockFind is a web application that helps people register assets, report lost belongings, record found items, and recover assets through a verified ownership-claim process.

## Project Goals

- Register and manage personal assets.
- Report lost assets and record found items.
- Match lost reports with found items.
- Allow authorized verifiers to review ownership claims.
- Maintain an auditable history of important actions.
- Introduce blockchain-based provenance after the core application works.

## User Roles

- **User:** Registers assets, reports lost items, searches, and submits claims.
- **Verifier:** Reviews evidence and approves or rejects ownership claims.
- **Admin:** Manages user roles and reviews system activity.

## Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT and bcrypt
- Blockchain: Solidity, Hardhat, ethers.js
- Version Control: Git and GitHub

## Development Approach

BlockFind will be developed incrementally. Each feature will be implemented, tested, and reviewed before the next feature begins.

## Current Status

Project initialization and environment verification are complete. Application development has not started yet.

## Project Structure

The repository is organized into three main applications and directories:

- `client/` — React and Vite frontend, including pages, reusable components, routing, and API services.
- `server/` — Express backend, including routes, controllers, middleware, business services, Prisma schema, migrations, and tests.
- `blockchain/` — Solidity smart contracts, Hardhat configuration, deployment scripts, and contract tests. Implementation begins after the core application workflow is functional.

The root directory contains shared documentation, Git configuration, and scripts for running development services.

## Core Development Principles

1. Implement one feature at a time.
2. Keep business logic in backend services rather than React components or route definitions.
3. Enforce authentication and role-based authorization on the server.
4. Keep personal information and evidence documents off-chain.
5. Test each feature before proceeding to the next.
6. Use Git commits as checkpoints after verified changes.