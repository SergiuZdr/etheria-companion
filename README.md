# Etheria Companion

A web companion for the mobile gacha RPG Etheria: Restart. Players sign in, mark which characters ("animuses") they own, get a suggested build for any owned animus, and use a live draft board during Real-Time Arena (RTA) matches that suggests the next pick or ban. Recommendations come from a large language model (Llama 3.3 70B through the Groq API), grounded with the game's rules and with win rates reported by the app's own users. This is an MVP: the core flows work, some parts are still placeholders (listed below).

## Features

- **Sign-in** with Google or Discord (Auth.js), sessions stored in the database.
- **Roster tracker**: a grid of 89 animuses with element, rarity, name search and filters; click to mark one as owned. Owned count is shown at the top.
- **Build optimizer**: for an owned animus, generates a suggested RTA build (modules, shells, imprints, reasoning). The build can be regenerated and saved with personal notes; saved builds are listed on the page.
- **RTA draft assistant**: choose who picks first, then enter picks for both sides in the real 1-2-2-2-2-1 order. After each change the app asks the model for the next three picks and a short team analysis; once all ten picks are in it suggests a ban. Slot 3 is shown as protected from bans, as in the game.
- **Match reporting**: after a draft, report a win or loss. Each animus's pick and win counts are updated per season and fed back into future draft prompts as community win rate data.
- **Meta stats page**: unfinished. The route exists but only shows placeholder text.

Only RTA builds are generated for now; the data model already has a `gameMode` field for other modes.

## Tech stack

- Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript
- Tailwind CSS 4
- Prisma 5 with PostgreSQL
- Auth.js (`next-auth` v5 beta) with the Prisma adapter
- Groq SDK (`llama-3.3-70b-versatile`) for recommendations
- ESLint 9 with `eslint-config-next`

## How it works

- **Data model** (`prisma/schema.prisma`): `Animus` is the shared character catalog; `UserAnimus` links users to the animuses they own; `UserBuild` stores saved builds as JSON; `RtaMatch` logs reported matches; `DraftPickStat` keeps picks and wins per animus and season. The rest are the standard Auth.js tables.
- **Seed data** (`prisma/seed.ts`): the catalog of 89 animuses with element and rarity. The seed clears and rebuilds the catalog, owned flags, builds and pick stats.
- **Build optimizer** (`src/app/roster/[id]/actions.ts`): a Server Action sends the animus's name, element and rarity plus a system prompt describing the game's gear system, asks for a fixed JSON shape, strips any code fences and parses it, falling back to raw text if parsing fails.
- **Draft logic** (`src/app/rta/DraftBoard.tsx`, `src/app/rta/actions.ts`): the client builds the pick order from who picks first, tracks ten pick slots and the ban phase, and calls the server (debounced by 500 ms) whenever picks change. The server adds the top 15 animuses by recorded wins from `DraftPickStat` to the prompt, lists the remaining available animuses, and asks for picks or a ban as JSON.
- **Match results** (`submitMatchResult` in `src/app/rta/actions.ts`): saves the match and upserts `DraftPickStat` for both teams, counting a win for whichever side won.

## Running locally

Requirements: Node.js 20 or newer, a PostgreSQL database, a Groq API key, and OAuth apps for Google and Discord.

There is no `.env.example` in the repo. Create a `.env` file with these variables:

- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `AUTH_SECRET`: required by Auth.js (generate one with `npx auth secret`)

Then:

```bash
npm install          # also generates the Prisma client
npx prisma db push   # create the tables
npm run seed         # load the animus catalog
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run lint`. There are no automated tests yet.

## Disclaimer

This is an unofficial fan project. It is not affiliated with, endorsed by or connected to the developers or publishers of Etheria: Restart. Game names and terms belong to their respective owners. AI suggestions can be wrong and are not official guides.
