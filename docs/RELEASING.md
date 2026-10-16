# Releasing shellside

The kit is consumed via vendored builds, not a registry — a "release" is
a semver tag plus a vendor re-sync into each consumer.

## Steps

1. `npm run check` must be green on a clean tree.
2. Add a dated `## [x.y.z] — YYYY-MM-DD` section to `CHANGELOG.md`
   (Keep-a-Changelog sections: Added / Changed / Fixed / Removed / Verified).
3. Commit the changelog, then tag:
   `git tag -a vX.Y.Z -m "vX.Y.Z — <release name>"`
   Push is the patron's call: `git push origin main --tags`.
4. Re-sync consumers so `check-vendor` sees the release SHA:
   `node scripts/sync-marquee-vendor.mjs` → commit `vendor/shellside/**`
   in the marquee with the release in the message.
5. GitHub release notes: draft from the changelog section (patron publishes).

## Version shape

- `0.x` while pre-R2 (no npm publish; breaking package changes are
  expected and noted in the changelog).
- Bump minor for added package surface, patch for fixes.
- The tag marks the SHA the vendored manifest stamps; keep them aligned
  — never tag a commit whose dist is not what consumers vendored.
