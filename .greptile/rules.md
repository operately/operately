# Review rules

## Jest test file suffixes

JS tests in `turboui/` and `app/assets/js/` use `.test.ts` / `.test.tsx`. Do not request renaming them to `.spec.ts` or `.spec.tsx`.

Greptile previously flagged `turboui/src/CompanyNavigation/truncateCompanyName.test.ts` for this. That was incorrect.

Elixir tests remain `*_test.exs`.
