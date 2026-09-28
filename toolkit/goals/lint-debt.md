# Goal: lint debt to zero
End state: `npm run lint` reports zero warnings and zero errors, and the tests still pass.
Check: npx biome lint . --error-on-warnings && npm test --silent
Bound: 8 turns; only files under app/ and scripts/; no rule may be disabled or downgraded in biome.json; no `biome-ignore` comments; behaviour unchanged (tests may lose unused imports or `any` types, but no assertion changes).
