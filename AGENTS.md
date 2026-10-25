# Architecture

- Keep furniture dimensions and validation in a pure calculation module with regression tests so screen, print and PDF use identical validated results.
- Keep sheet ordering in a shared pure helper so screen and exports cannot diverge; preserve source identity when deleting custom pieces.
- Generate PDFs with text and table pagination rather than a full-document canvas to keep dimensions readable and avoid cut rows.
- Home-screen installation uses manifest metadata and local icons only; do not introduce app-shell service workers without an explicit offline requirement.