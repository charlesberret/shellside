# Marquee switch (proof A remainder)

Shellside now owns the pure edit-path grammar and the pure look-role map. charlesberret.net should import these packages and delete the local duplicates. This checkout cannot edit that repo (it is private and not granted to the shellside credential).

Dependency, from the marquee root, alongside the existing content-model `file:` dep:

```json
"@shellside/edit-protocol": "file:../shellside/packages/edit-protocol",
"@shellside/look": "file:../shellside/packages/look"
```

Replace local `parseContentPath` / link-leaf helpers in `content-edit.ts`:

```ts
import {
  parseContentPath,
  isWellFormedEditPath,
  isAllowedEditPath,
  linkLeafFromPath,
  fieldKindFromPath,
  contentFileForPath,
} from "@shellside/edit-protocol";
```

Pass a site policy if archive paths must stay out of the desk. Override `contentFileForPath` rules if a collection directory differs from `work/`, `writing/`, `records/`, `profile/profile.yaml`, `page-copy/`.

Replace `pathToLookRole` and the role id list in `look-roles.ts` with a thin re-export:

```ts
export {
  pathToLookRole,
  LOOK_ROLE_IDS,
  isLookRoleId,
  crossSkinStyle,
  WEIGHT_OPTIONS,
  SIZE_OPTIONS,
  FONT_OPTIONS,
} from "@shellside/look";
```

Keep token CSS, typeface stacks, and palette in the site. `SIZE_KEYS` / `FONT_KEYS` are slot names (`base`, `prose`, `display`), not CSS lengths or font files.

After the switch: marquee build green, then delete the local parsers. Do not keep a second role map.

Parity was taken from the public build’s `data-edit` paths and the generated look CSS (2026-10-06), not from a local marquee checkout:

- `writing:*:byline` shares `item-meta` with venue / role / award / year (same emitted rule).
- `page:writing.group*` shares `section-heading` with `page:*section*`.
- `writing:*:type`, `profile:shortBio`, `profile:now.intro`, `page:console.nowOpenLabel`, and `page:portfolio.heroAccent2` stay path-specific. The emitted CSS does not group them with another role.
- Link leaves remain `label` / `href` / `description`. `href` is in the look CSS even when the public HTML does not mark it `data-edit`.
