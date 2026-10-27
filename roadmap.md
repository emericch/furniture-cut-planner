# Optimisation

- [ ] Correct the four requested sheet bugs only: fixed-dimension grain pivots and one-time legacy migration, grain-aware grouped pivots, undo in the originating list, and exit editing when clearing; verify unit tests, browser scenarios and PDF without changing appearance, formulas, dependencies or plan.

- [x] Retiré les boutons « Montants et dos » et « Bandeaux et façades » sous le dessin : seules les icônes cliquables posées sur le schéma restent (125 tests, build OK, Chromium contrôlé à 1280 et 586 px).
- [x] Renommer la liste de débit active : bouton « Renommer » à côté du menu des listes, édition en ligne (Entrée valide, Échap annule, vide refusé), persistance vérifiée ; 125 tests passent.
- [x] Défauts d'ouverture : miniature activée par défaut (même pour les listes stockées avant ce changement) et meuble standard H765 L600 P550, porte en applique, 2 rayons, dos en applique ; vérifié dans Chromium.

- [x] Deep debug of latest sheet changes: 108 tests pass and build OK; Chromium verified reload/edit/cancel/update/delete/undo, switching edited cabinets, grouping and pivots in screen/print/PDF, 586 px layout and corrupted storage; 168 malformed-storage mutations checked. Fixed nested-config startup crashes, independent collection recovery and creation-draft loss on reload during editing. Existing preview instrumentation ref warnings remain non-blocking; physical Safari/AirPrint not verified. A cabinet with corrupt cutting rows remains rejected as a whole to avoid presenting an incomplete cutting list as usable; formulas, dependencies, presentation and pending plan untouched.

- [x] Step 2 fixes: tolerant sheet parsing (invalid form config or single corrupt entries no longer wipe the sheet) and form backup restored on edit cancel/update/delete; 104 tests pass, build OK, Chromium verified both scenarios.


- [x] Step 1 of validated calculation rules: 1 mm overlay edges, grain-direction lengths, shelf zones outside drawer stacks, coherent assembly/back pairing, hidden bands behind full-height doors and small-piece warnings; 85 tests pass, build OK, Chromium verifies full-height door, hidden band, warnings and blocked incoherent pairs; cut-sheet functions (step 2) untouched.
- [x] Step 2: cut-sheet workflow — grain pivot per row with filPivote re-applied on edit, optional identical-piece grouping in both orderings, localStorage save/restore with corruption guard, meuble edit/update/cancel, undo-delete toasts, hidden-band fixes; shared pure sheet module feeds screen, print and PDF; 101 tests pass, build OK, Chromium verified persistence, edit, undo, pivot in PDF, grouping and corrupted-storage startup.

- [x] Fix the four requested browser bugs only: invalid numeric drafts, 32 mm shelf clearance, empty split-drawer validation and independent shelf/drawer sides; 76 tests pass, build OK, Chromium confirms disabled invalid submissions and independent sides with saved drawer pieces; no input/runtime errors, existing preview ref warnings remain; presentation, cutting formulas, dependencies and pending plan untouched.

- [x] Fix the five requested bugs only: French decimal entry, safe drawing sizes, blank rename cancellation, overlay defaults when adding doors to drawers, and consistent French dimensions; 70 tests pass (62 existing + 8 new), build OK, Chromium fr-FR flows and PDF download verified; presentation, formulas and pending plan untouched.

- [x] Fix requested production advisories: remove unused @react-three/drei, update jspdf 4.2.1, react-router-dom 7.18.4 and zod 4.6.7; resolve fflate 0.8.3, dompurify 3.4.17 and lodash 4.18.1 in both text lockfiles. Production scan clear; 62 tests and PDF download pass, build OK; pending optimization plan and presentation untouched.
- [ ] Resolve six moderate development-tool advisories in @tailwindcss/typography, postcss-selector-parser, postcss-nested, tailwindcss, tailwindcss-animate and lovable-tagger: upstream constraints do not permit a patched parser; awaits approval for a potentially visual-affecting tooling migration, without forced transitive overrides.

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
- [x] Add a side view next to the front view showing back panel, shelves and fronts at their true depths (pure helper + 6 tests, checked at 586/1280 px).
- [x] Side view: place shelves against the back panel so the clearance shows between shelf and door, not between shelf and back.
- [x] Optional furniture thumbnails (front + side) per meuble in the cutting sheet: screen, print SVG and PDF vector rects, persisted in localStorage (4 new tests, browser-checked).
- [ ] Physical Safari/iOS, AirPrint and home-screen installation checks: unavailable hardware; WebKit unavailable.
- [ ] Publish updated app or configure external free hosting: awaits user's explicit deployment request and hosting account.
- [x] F : bouton « Ajouter à la feuille » fixe en bas sur téléphone + miniature du meuble en haut
- [x] G : sections repliables avec résumé
- [x] Réduire chaque meuble dans la feuille de débit
- [x] Colonne « Fil » (L/l) sur chaque pièce de la feuille de débit : écran, impression et PDF, avec légende mise à jour et regroupement sensible au fil (130 tests).
