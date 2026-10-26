# Architecture

- Keep furniture dimensions and validation in a pure calculation module with regression tests so screen, print and PDF use identical validated results.
- A piece's longueur always follows the grain direction: vertical (height) for doors, drawer and band fronts, sides, dividers and backs; horizontal (width) for traverses, bands and shelves; the drawing converts back to geometric width/height.
- Keep numeric cutting-list audit fixtures separate from production formulas to detect regressions against independently calculated reference dimensions.
- Derive panel presence, opening heights and front depth allowances through one shared layout helper; reveal optional band and drawer controls in a dedicated conditional form to avoid duplicating dimension logic.
- Keep centered-divider bay widths and front/back clearance planes in the pure layout helper; split horizontal panels for full-height dividers to avoid intersections and use the same generated rows for all outputs.
- Use a continuous configuration form with a separate text-free cabinet drawing; drawing targets scroll to visible sections rather than hiding menus, and front geometry uses manufacturing dimensions to keep the preview faithful.
- Keep sheet ordering in a shared pure helper so screen and exports cannot diverge; preserve source identity when deleting custom pieces.
- Generate PDFs with text and table pagination rather than a full-document canvas to keep dimensions readable and avoid cut rows.
- Home-screen installation uses manifest metadata and local icons only; do not introduce app-shell service workers without an explicit offline requirement.
- Keep bun.lock and package-lock.json consistent for security-sensitive dependency resolutions; use text lockfiles so scanners can verify installed fixes without forced transitive overrides.