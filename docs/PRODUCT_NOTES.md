# Product notes (private)

## Positioning (working)

Shellside is a **filesystem-first dual-surface portfolio kit** with a **dev editorial desk** — not WordPress, not Sanity, not a SaaS.

People might care if:

- Dual readable + console surfaces stay rare and well-executed  
- Live-edit against the real page (role Look, weight, rollback) feels craft-respecting  
- Content model is honest (YAML/MD you can grep and git)  
- Docs make agent + human onboarding cheap  

## Non-positioning

- Not competing with full CMS platforms  
- Not multi-user production editing (yet)  
- Not a theme marketplace  

## Open questions

- Package name when public? (shellside is fine for private)  
- Astro-only vs surface-agnostic content layer  
- Console as optional package vs core pillar  

## Release stance (see ROADMAP.md)

- **R0** — internal kit: marquee on pure contracts; agents onboard from this repo  
- **R1** — private release: reference app proves dual-surface without marquee chrome  
- **R2** — publishable packaging (optional; product decision to open)  

Default engineering target: **R1**. Console **VFS contracts** are core pillar; console **personality** stays marquee-local.
