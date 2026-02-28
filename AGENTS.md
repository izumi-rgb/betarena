# AGENTS.md — Learned memory for BetArena

This file is updated by the continual-learning workflow from agent transcripts. Only high-signal, reusable preferences and workspace facts are stored.

## Learned User Preferences

- Prefer completing one step fully before moving to the next; do not skip ahead in the plan.
- When executing a plan, do not edit the plan file itself; mark todos as in_progress as you work and complete them in order.
- The home page should load first for visitors; do not redirect unauthenticated users to login automatically — show a public landing with a "Log in" link instead.
- Backend and implementation updates should be documented in Notion (e.g. BetArena Backend Documentation) when significant backend work is done.
- When building multiple independent areas (e.g. different screens, bet types vs UI), use parallel agents per domain where there is no shared state.

## Learned Workspace Facts

- BetArena is a full feature-for-feature clone of Bet365 using virtual/demo credits; monorepo: apps/web (Next.js 14), apps/api (Express), packages/shared.
- Build plan lives in Plan.md and .cursor/plans (e.g. cursorrules, plan files); 19 steps across 9 phases.
- Docker: PostgreSQL 15 and Redis 7 via docker-compose (ports 5433, 6380); API port 4000, web port 3000 (or 3001/3002 if in use).
- UI follows Bet365-style layout and density; BetArena uses deep green and yellow accent (hsl) as brand variation; design reference in bet365-screenshots/ and DESIGN_TASKS.md.
- Notion plugin is available for search, fetch, create-pages, update-page; backend doc page ID 30c5d744-4640-81d3-840e-f1a6a52a58e9.
