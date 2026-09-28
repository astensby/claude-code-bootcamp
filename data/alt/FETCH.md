# How the `data/alt/` snapshots were cut (2026-09-27, revised 2026-09-28)

Both files are offline copies. Re-run these only to refresh them; exercises never touch the live APIs.

## ssb-private-cars-by-fuel.csv

SSB PxWeb API v0, table 07849, JSON-stat2 response, then summed over `KjoringensArt` (type of transport) so each row is one municipality × fuel × year.

```bash
# 1. metadata → the list of current 4-digit municipality codes: labels WITHOUT a retired-code suffix such as "(2020-2023)".
#    Four current municipalities carry a disambiguating suffix instead ("Herøy (Nordland)", "Herøy (Møre og Romsdal)",
#    "Våler (Østfold)", "Våler (Innlandet)") and must be kept: 405 codes, placeholders included.
curl -s https://data.ssb.no/api/v0/en/table/07849 > meta.json

# 2. data: all current codes × all transport types × all fuels × private cars × 2008–2025 (306 180 cells, under the 800 000-cell limit)
curl -s -X POST https://data.ssb.no/api/v0/en/table/07849 \
  -H 'Content-Type: application/json' \
  -d '{"query":[
        {"code":"Region","selection":{"filter":"item","values":[ …405 codes from meta.json… ]}},
        {"code":"KjoringensArt","selection":{"filter":"all","values":["*"]}},
        {"code":"DrivstoffType","selection":{"filter":"all","values":["*"]}},
        {"code":"ContentsCode","selection":{"filter":"item","values":["Personbil1"]}},
        {"code":"Tid","selection":{"filter":"all","values":["*"]}}],
       "response":{"format":"json-stat2"}}' > 07849.json
```

Post-processing (python3, csv module): sum values over `KjoringensArt`; `county_code` = first two digits of the municipality code, `county` = the 2-digit region label from the same metadata; then only real municipalities kept: rows whose code ends in `99` (SSB's unknown-municipality placeholder, one per county) or whose county code is `21` (Svalbard), `22` (Jan Mayen), `23` (the continental shelf) or `99` (county not stated) dropped, leaving 357 municipalities × 6 fuels × 18 years = 38 556 rows; commas/semicolons/newlines inside labels replaced by a space so the CSV needs no quoting.

Revision 2026-09-28: the first cut had kept the placeholder regions and, because its step 1 excluded every label with a "(…)" suffix, had missed the four suffixed municipalities (1515, 1818, 3114, 3419). Those four were fetched with the same query restricted to their codes and merged in, and the placeholders dropped, so the file now matches the description above.

## brreg-employers-50plus.csv

Enhetsregisteret REST API, filter `fraAntallAnsatte=50`, paged 500 at a time (the API caps `page × size` at 10 000; 8 058 rows fit, 8 038 after the filter below).

```bash
for page in $(seq 0 16); do
  curl -s -H 'Accept: application/json' \
    "https://data.brreg.no/enhetsregisteret/api/enheter?fraAntallAnsatte=50&size=500&page=$page" > enheter-$page.json
done
```

Post-processing: from each `_embedded.enheter[]` take `organisasjonsnummer`, `navn`, `organisasjonsform.kode`, `naeringskode1.kode`, `naeringskode1.beskrivelse`, `forretningsadresse.kommune` (fallback `postadresse`), `forretningsadresse.kommunenummer`, `stiftelsesdato`, `antallAnsatte`, `registreringsdatoEnhetsregisteret`; `fylke` = county name for the first two digits of `kommunenummer` (same county table as above); whitespace and separators normalised as for the SSB file. Rows with `organisasjonsform.kode` = `ENK` (sole proprietorships, 20 of them) dropped: they are named after private individuals (`awk -F, 'NR==1 || $3!="ENK"'`, line endings untouched).
