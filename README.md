# Kennis Shop

Next.js-app voor de Kennis Shop tools van [Energieke Lieke](https://energiekelieke.nl).

## Commands

```bash
npm install        # installeer afhankelijkheden
npm run dev        # start lokale dev-server op localhost:3000
npm run build      # productie-build
npx tsc --noEmit   # type check zonder build
```

Vereiste env var: `ANTHROPIC_API_KEY` in `.env.local`.

## Tools

- **Doelgroep analyse** (`/doelgroep-analyse`): beoordeelt hoe concreet en visualiseerbaar de ideale klant is beschreven, met AI-feedback per vraag, een score op 5 punten en een PDF-export.
