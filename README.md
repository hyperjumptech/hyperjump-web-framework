# Hyperjump Web Framework (WIP)

This is the monorepo for the Hyperjump Web Framework.

## Usage

```bash
pnpm install
```

## Running the docs

```bash
pnpm docs:dev
```

## Running the demo web app

Prepare the `.env.local` files by running the following command:

```bash
./dev-bootstrap.sh
```

Then run the following command to build the web app:

```bash
pnpm build --filter=web
```

Or to run the development server:

```bash
pnpm dev --filter=web
```
