# Percent-encoding table — https://thalasses-villas-redesign.vercel.app

Run 2026-09-14T15:19:28.567Z with `node scripts/encoding-table.mjs`. Paths are sent exactly as written.

| route | spelling | path sent | status | matched page | type | CSP lines | bytes | region hops |
|---|---|---|---|---|---|---|---|---|
| `/en/contact` | plain | `/en/contact` | 200 | `/en/contact` | text/html | 1 | 30898 | fra1::iad1 |
| `/en/contact` | first letter, %XX | `/en/%63ontact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | hex letter, lower-case escape | `/en/c%6fntact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | hex letter, upper-case escape | `/en/c%6Fntact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | locale segment encoded | `/%65n/contact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | %2F between segments | `/en%2Fcontact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | encoded trailing slash | `/en/contact%2F` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | %2e segment | `/en/%2e/contact` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | %2e%2e segment | `/en/x/%2e%2e/contact` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | double-encoded (%25XX) | `/en/%2563ontact` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | trailing %20 | `/en/contact%20` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | appended %C3%A9 | `/en/contact%C3%A9` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | locale upper-case | `/EN/contact` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/contact` | first letter encoded + .rsc | `/en/%63ontact.rsc` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/contact` | first letter encoded, RSC header (RSC: 1) | `/en/%63ontact` | 500 | `/500` | text/html | 1 | 8993 | fra1 |
| `/en/the-estate` | plain | `/en/the-estate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | first letter, %XX | `/en/%74he-estate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | hex letter, lower-case escape | `/en/the%2destate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | hex letter, upper-case escape | `/en/the%2Destate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | locale segment encoded | `/%65n/the-estate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | %2F between segments | `/en%2Fthe-estate` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | encoded trailing slash | `/en/the-estate%2F` | 200 | `/en/the-estate` | text/html | 1 | 187911 | fra1 |
| `/en/the-estate` | %2e segment | `/en/%2e/the-estate` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | %2e%2e segment | `/en/x/%2e%2e/the-estate` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | double-encoded (%25XX) | `/en/%2574he-estate` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | trailing %20 | `/en/the-estate%20` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | appended %C3%A9 | `/en/the-estate%C3%A9` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | locale upper-case | `/EN/the-estate` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/the-estate` | first letter encoded + .rsc | `/en/%74he-estate.rsc` | 200 | `/en/the-estate.rsc` | text/x-component | 1 | 60193 | fra1 |
| `/en/the-estate` | first letter encoded, RSC header (RSC: 1) | `/en/%74he-estate` | 200 | `/en/the-estate.rsc` | text/x-component | 1 | 60193 | fra1 |
| `/en/villas/villa-thoi` | plain | `/en/villas/villa-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | first letter, %XX | `/en/villas/%76illa-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | hex letter, lower-case escape | `/en/villas/vi%6cla-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | hex letter, upper-case escape | `/en/villas/vi%6Cla-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | locale segment encoded | `/%65n/villas/villa-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | %2F between segments | `/en/villas%2Fvilla-thoi` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | encoded trailing slash | `/en/villas/villa-thoi%2F` | 200 | `/en/villas/villa-thoi` | text/html | 1 | 174448 | fra1 |
| `/en/villas/villa-thoi` | %2e segment | `/en/villas/%2e/villa-thoi` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | %2e%2e segment | `/en/villas/x/%2e%2e/villa-thoi` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | double-encoded (%25XX) | `/en/villas/%2576illa-thoi` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | trailing %20 | `/en/villas/villa-thoi%20` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | appended %C3%A9 | `/en/villas/villa-thoi%C3%A9` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | locale upper-case | `/EN/villas/villa-thoi` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/villas/villa-thoi` | first letter encoded + .rsc | `/en/villas/%76illa-thoi.rsc` | 200 | `/en/villas/villa-thoi.rsc` | text/x-component | 1 | 61030 | fra1 |
| `/en/villas/villa-thoi` | first letter encoded, RSC header (RSC: 1) | `/en/villas/%76illa-thoi` | 200 | `/en/villas/villa-thoi.rsc` | text/x-component | 1 | 61030 | fra1 |
| `/en/experiences/boat-trip` | plain | `/en/experiences/boat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | first letter, %XX | `/en/experiences/%62oat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | hex letter, lower-case escape | `/en/experiences/b%6fat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | hex letter, upper-case escape | `/en/experiences/b%6Fat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | locale segment encoded | `/%65n/experiences/boat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | %2F between segments | `/en/experiences%2Fboat-trip` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | encoded trailing slash | `/en/experiences/boat-trip%2F` | 200 | `/en/experiences/boat-trip` | text/html | 1 | 35997 | fra1 |
| `/en/experiences/boat-trip` | %2e segment | `/en/experiences/%2e/boat-trip` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | %2e%2e segment | `/en/experiences/x/%2e%2e/boat-trip` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | double-encoded (%25XX) | `/en/experiences/%2562oat-trip` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | trailing %20 | `/en/experiences/boat-trip%20` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | appended %C3%A9 | `/en/experiences/boat-trip%C3%A9` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | locale upper-case | `/EN/experiences/boat-trip` | 404 | `/404` | text/html | 1 | 29443 | fra1 |
| `/en/experiences/boat-trip` | first letter encoded + .rsc | `/en/experiences/%62oat-trip.rsc` | 200 | `/en/experiences/boat-trip.rsc` | text/x-component | 1 | 17834 | fra1 |
| `/en/experiences/boat-trip` | first letter encoded, RSC header (RSC: 1) | `/en/experiences/%62oat-trip` | 200 | `/en/experiences/boat-trip.rsc` | text/x-component | 1 | 17834 | fra1 |
