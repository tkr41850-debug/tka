---
phase: 06-trustworthy-first-run-access
plan: 01
subsystem: trust-state
tags: [dismissals, announcements, session-state]
completed: 2026-03-10
---

# Phase 6 Plan 01 Summary

- Added session-only dismissal keys and centralized live-announcement copy in `src/features/workspace/lib/createDismissedFindingKey.ts` and `src/features/workspace/lib/createAnnouncementMessage.ts`.
- Moved dismissal and announcement state into `src/App.tsx` so visible findings can be filtered without changing analyzer output.
- Wired initial dismiss and restore handling through `src/features/workspace/components/WorkspaceSnapshot.tsx` and `src/features/workspace/components/ReviewDetailPanel.tsx`.
- Expanded `src/App.test.tsx` coverage and verified with `npm run test -- --run src/App.test.tsx` plus `npm run build`.
