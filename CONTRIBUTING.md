# Contributing

This project does not yet have a public issue tracker or a chosen license. Open an issue or pull request only after the maintainer publishes the repository and says how they want contributions handled.

## Local checks

There is no automated test suite. Before sending a change, run:

```bash
npm run lint
```

That command is `tsc --noEmit`. It type-checks the TypeScript sources. It does not start MySQL or the API.

## What not to commit

- `.env`, or any file that contains a database password
- `server/uploads/` and `server/backups/`
- `node_modules/` and `dist/`

Demo accounts in `database_schema.sql` use a shared local password. Do not reuse that password outside a local database.
