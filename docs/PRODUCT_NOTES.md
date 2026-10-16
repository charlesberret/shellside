# Product notes

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

- Package name on registries — repo is public MIT since 2026-10-14; npm/PyPI `shellside` reservation is LAB-113 (patron creds)  
- Astro-only vs surface-agnostic content layer  
- Console as optional package vs core pillar  

## Release stance (see ROADMAP.md)

- **R0** — internal kit **and** content portability smoke: (A) marquee on pure contracts; (B) scripted marquee **content** export loads into a shellside host and a **production build** renders the public graph correctly (structural fidelity, not visual twin)  
- **R1** — second-site release: dual-surface reference (portfolio + console) with marquee public content as acceptance fixture + leak audit — both landed 2026-10-15  
- **R2** — publishable packaging (optional). Repo is already public; R2 is npm/registry + create-site ergonomics  

Default engineering target: **R1**. Console **VFS contracts** are core pillar; console **personality** stays marquee-local. Export is **content only**—never a second marquee deploy.
