# About

This package is a wrapper around the Prisma v7 client that supports schema and SSL connections to connect to the MediaPulse database.

# After cloning the repository

If you are cloning the repository to create a new project, you need to run the following command to create the symlinks for the environment variables:

```bash
./dev-bootstrap.sh
```

This will create the symlinks for the environment variables in the apps and packages directories.

Then update the schema.prisma file to your needs and delete the migrations directory.

Then run the following command to start the database migrations and generate the Prisma client:

```bash
pnpm db:migrate:dev
```

# SSL Connections

To support SSL connections, you need to set the DATABASE_CERT_BASE64 environment variable with the base64 encoded certificate by following these steps:

1. Download the certificate
2. Run `base64 -i the-certificate.crt -o the-certificate-base64.txt` to generate the base64 encoded certificate
3. Set the DATABASE_CERT_BASE64 environment variable with the content of the-certificate-base64.txt
4. Make sure the postgres url contains `sslmode=require`

Example of the postgres url:
postgres://root:root@localhost:5432/elearning?schema=public&sslmode=require

# Usage

Whenever you make a change to the `schema.prisma` file, you need to run the following command to generate the Prisma client:

```bash
pnpm db:migrate:dev
```

To use the generated Prisma client,

1. Add `"@workspace/database": "workspace:*"` to the `package.json` file of the app.
2. Run `pnpm install` to install the dependencies.
3. Import the `prismaClient` from the `@workspace/database` package in the code.

```ts
import { prismaClient } from "@workspace/database";
```

3. Use the `prismaClient` to query the database.

```ts
const users = await prismaClient.user.findMany();
```

# Environment Variables

| Variable           | Description                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| DB_POOLING_URL     | The connection string to the database with connection pooling. (required)    |
| DB_URL_NON_POOLING | The connection string to the database without connection pooling. (required) |
| DB_CERT_BASE_64    | The base64 encoded certificate for the SSL connection.                       |
