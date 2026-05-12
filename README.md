# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## ETF data (EODHD + Supabase)

1. Apply SQL: run [`supabase-setup.sql`](supabase-setup.sql) for a new project, or [`supabase-migration-etfs-extended.sql`](supabase-migration-etfs-extended.sql) on an existing DB that already had the old `etfs` table.
2. `.env`: `EODHD_API_KEY`, `PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (scripts), plus anon URL/key for the app.
3. **Discover** (`npm run discover:etfs`) → writes `data/etf-universe.json` using `exchange-symbol-list` + bulk EOD + history filter (`DISCOVER_MIN_EOD_DAYS` default **250**). Target exchanges: [`scripts/lib/constants.ts`](scripts/lib/constants.ts). Optional env: `DISCOVER_EXCHANGES=US`, `DISCOVER_MAX_ETFS=50`, etc. Needs an EODHD plan with **EOD + bulk** (e.g. All-In-One / All World Extended).
4. **Fundamentals** (`npm run seed:fundamentals`) — reads `etf-universe.json`, calls Fundamentals API, upserts `etfs` + child tables. Optional: `SEED_FUNDAMENTALS_MAX=10`.
5. **Prices** (`npm run seed:prices`) — EOD → `return_1w`…`return_1y` for all rows in `etfs`. Optional: `SEED_PRICES_MAX=20`.
6. **Production chart** (`/api/chart`) — set `EODHD_API_KEY` in Netlify (server) so the dashboard panel can load real OHLC from EODHD.

**GitHub Actions:** [`.github/workflows/etf-refresh.yml`](.github/workflows/etf-refresh.yml) — weekly `seed:prices`, monthly `seed:fundamentals` + `seed:prices`. Add repo secrets: `EODHD_API_KEY`, `PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Use *Run workflow* with “Rebuild universe” / “Run fundamentals” when you want a full refresh.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
