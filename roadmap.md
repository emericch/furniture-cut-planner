# Optimisation

- [ ] Fix the requested dependency advisories, verify resolved lockfile versions, run regression tests and check the working app; keep the pending optimization plan and visual presentation unchanged.

- [x] Apply only the requested split-back dimensions, equal drawer-stack validation, 0.01 mm rounding and decimal input keyboard fixes; 62 tests pass (53 existing + 9 new), and 147.5 reads back in the cutting sheet; no visual changes. Security optimization plan remains pending approval.

- [x] Review recorded security scan results and dependency alerts; 53 regression tests pass. Recorded scans are stale, dependency advisories exist, and lockfiles disagree with installed jsPDF.
- [ ] Review a fresh deep security scan before public presentation: user must run it in the Security tab.
- [ ] Propose confirmed code-weight and maintainability optimizations for approval; do not modify application code or dependencies before approval.

- [x] Correct front coverage and removed-panel rendering; replace step navigation with continuous menus and assess novice usability (53 tests pass, 320/666/820/1280 px verified; no real-child usability test).

- [x] Simplify the cabinet drawing and option labels; verify all four steps and furniture addition at 320/390/820/1280 px without changing calculations (49 regression tests pass).

- [x] Add centered intermediate upright, continuous/split backs with 5 mm grooves and compartment shelves without panel intersections.
- [x] Support common fronts and separate left/right drawer fronts; replace accumulated controls with clickable drawing and short steps.
- [x] Test dimensions, clearances and actual addition/export across new combinations and screen sizes.

- [x] Clarify dimensional rules for fixed bands, overlay fronts, drawer fronts only and fixed/mobile shelves.
- [x] Add conditional band/drawer controls, fixed-shelf counts and shared layout calculations; prevent unsupported grooved backs without horizontal panels.
- [x] Pass 40 regression tests including 240 new-option combinations; verify sink/hood additions, PDF parts and layouts at 320/390/820/1280 px in Chromium.

- [x] Generate and inspect a 60-variant cutting-list PDF/CSV; compare 422 rows with independent numeric references, test 57,600 thickness combinations, and reject impossible back/door depths even without shelves (28 tests pass).

- [x] Audit calculations and clarify construction rules.
- [x] Isolate and test dimensional rules; correct confirmed errors (22 tests / 60 variants).
- [x] Improve readable layouts across phone, tablet and desktop.
- [x] Verify complete furniture deletion and add furniture/size list ordering.
- [x] Integrate bear logo, favicon, creator 2026 and support address.
- [x] Add manifest-only installation and document GitHub Pages free hosting option.
- [x] Verify calculation flows, exports, print document and Chromium/Firefox presentation.
- [ ] Physical Safari/iOS, AirPrint and home-screen installation checks: unavailable hardware; WebKit unavailable.
- [ ] Publish updated app or configure external free hosting: awaits user's explicit deployment request and hosting account.