# Landing Page Feature Plan (Frontend)

> Plan written **before** implementation. No code until approved. Frontend-only.
> Scope: a marketing landing page at `/` that reuses the existing UI. The existing auth pages are
> **not** changed — the landing's buttons just link to the current `/login` and `/signup`.

## 0. How it stays visually consistent (project analysis)

- **Design tokens:** reuse the `:root` variables in `signup.css` — `--accent #3b6ef0`,
  `--bg #f4f6f8`, `--card #fff`, `--text`, `--muted`, `--border`, `--ok`, `--error`. No new palette.
- **Typography:** the existing system font stack. No new fonts.
- **Components:** no `Button`/`Card`/`Input` library exists — reuse `signup.css` classes
  (`.submit`, `.card`, etc.) and the `Header` logo markup; new landing pieces use the same tokens.
- **Aesthetic:** soft shadows, ~9–14px radii, blue accent, light theme. **No glassmorphism**
  (not in the current design). Minimal motion (one hero entrance + card hover).

## 1. Plan

### Objective
Add a polished marketing **landing page** as the entry point (`/`) — nav, hero ("Welcome to
Pulse"), features, why-choose-us, CTA, and footer — visually consistent with the current app.
Its buttons route to the **existing** Sign In (`/login`) and Sign Up (`/signup`) pages.

### Scope
In scope: `LandingPage` + sections, a marketing `LandingNav` + `Footer`, a `landing.css` (existing
tokens only), routing changes (`/` → landing, signup → `/signup`), and repointing existing
"sign up" links to `/signup`.

Out of scope: **any changes to `LoginPage` / `SignupPage`** (no Remember Me, Google button,
username, confirm-password, etc. — buttons simply link to them); backend changes; new design
system; new icon dependency (use inline SVGs).

---

## 2. Routing change (the one structural change)

`/` is currently the Signup page. Plan:
```
/         → LandingPage   (new entry point)
/signup   → SignupPage    (moved from "/")
/login    → LoginPage     (unchanged)
… all other routes unchanged
```
Repoint internal links that point to `/` as "sign up" → `/signup`:
- `LoginPage` "Create an account"
- `ForgotPasswordPage` "Back to sign up"
- `VerifiedAlreadyPage` / `VerificationInvalidPage` "Back to sign up"

*(These are link-target edits only; no other logic in those pages changes.)*

---

## 3. Specification

### 3.1 `LandingNav` (sticky marketing nav)
- Pulse logo (reuse `Header`'s badge + wordmark) on the left.
- Links: Home / Features / About / Contact (anchor-scroll to sections).
- Right: **Sign In** → `/login`, **Sign Up** → `/signup` (styled with existing button classes).
- Mobile **hamburger** toggling the menu. Semantic `<nav>`, keyboard accessible, visible focus.

### 3.2 Hero
- Headline: **"Welcome to Pulse"**.
- Short descriptive subtitle.
- Primary CTA **Get Started** → `/signup`; secondary **Learn More** → scrolls to Features.
- Abstract CSS/SVG graphic (no image asset). Subtle entrance animation.

### 3.3 Features
- 3–6 cards: inline-SVG icon + title + short description, hover lift. Responsive CSS grid.

### 3.4 Why Choose Us
- Split layout (abstract illustration + content), bullet points, a few small stats.

### 3.5 Call To Action
- Centered: **Sign Up** → `/signup`, **Sign In** → `/login`.

### 3.6 `Footer`
- Logo, copyright, quick links, contact, social inline-SVG icons, Privacy Policy, Terms of
  Service (legal/social as `#` placeholders).

### 3.7 `landing.css`
- Layout for nav/hero/features/why/cta/footer, built **only** from existing CSS variables.

---

## 4. Design Requirements Mapping
Smooth hover, subtle gradients from `--accent`/`--bg`, soft shadows, rounded corners, consistent
spacing — all from existing tokens. Responsive (mobile/tablet/desktop) via flex/grid + hamburger.
Accessible: semantic landmarks, labelled controls, keyboard nav, visible focus. No glassmorphism.
Animations minimal.

---

## 5. AI Prompts (verbatim)

### Prompt 1 — Feature request
> ok i want you create .md file for [a modern SaaS landing page consistent with the existing app:
> sticky header w/ logo + Home/Features/About/Contact + Sign In/Sign Up + hamburger; hero w/ Get
> Started + Learn More; 3–6 feature cards; Why Choose Us split; centered CTA; footer; reuse existing
> components/structure; React Router; modular, responsive, accessible].

### Prompt 2 — Scope refinement
> continue with / and change signup to /signup dont make new sign up page and login page just make
> the button connect to current signup and login make the landing page consistent with current ui
> and it should give welcom to pulse in hero section update .md file based on this

---

## 6. Supporting Documentation

### Files to be Created / Modified (planned)

| File | Change |
|------|--------|
| `frontend/src/LandingPage.jsx` *(new)* | Hero ("Welcome to Pulse") + Features + Why + CTA |
| `frontend/src/LandingNav.jsx` *(new)* | Sticky marketing nav + hamburger |
| `frontend/src/Footer.jsx` *(new)* | Footer (links, contact, social, legal) |
| `frontend/src/landing.css` *(new)* | Landing layout, existing tokens only |
| `frontend/src/App.jsx` | `/` → Landing; signup → `/signup` |
| `frontend/src/LoginPage.jsx` | Repoint "Create an account" link → `/signup` (link only) |
| `frontend/src/ForgotPasswordPage.jsx` | Repoint "Back to sign up" → `/signup` (link only) |
| `frontend/src/VerifiedAlreadyPage.jsx`, `VerificationInvalidPage.jsx` | Repoint "Back to sign up" → `/signup` (link only) |

> **No changes** to `LoginPage`/`SignupPage` beyond the one link repoint above — the landing
> buttons just navigate to them.

### Acceptance Criteria
- [ ] `/` renders the landing page (nav, hero "Welcome to Pulse", features, why, CTA, footer).
- [ ] Nav Sign In/Sign Up + hero/CTA buttons route to `/login` / `/signup`.
- [ ] Signup moved to `/signup`; all internal "sign up" links repointed.
- [ ] Responsive (mobile hamburger) + accessible.
- [ ] Visual style matches existing tokens; no new design system; no glassmorphism.
- [ ] `LoginPage`/`SignupPage` themselves are otherwise unchanged.

### Open Items / Decisions (resolved)
1. Route: signup → `/signup`, landing → `/`. ✅
2. No new auth pages; buttons link to existing `/login` and `/signup`. ✅
3. Hero headline: "Welcome to Pulse". ✅
4. Marketing nav as a separate `LandingNav`. ✅
5. Footer legal/social as `#` placeholders. (assumed)
