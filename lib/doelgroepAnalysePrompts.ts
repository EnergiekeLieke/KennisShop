const CORRECT_NL = 'Schrijf in correct Nederlands: grammaticaal juist, correcte spelling, correcte woordkeuze en geen anglicismen.';

export interface DoelgroepAntwoorden {
  v1: string;
  v2: string;
  v3: string;
  v4: string;
}

export interface DoelgroepVraag {
  key: keyof DoelgroepAntwoorden;
  label: string;
  placeholder: string;
}

export const DOELGROEP_VRAGEN: DoelgroepVraag[] = [
  { key: 'v1', label: 'Vraag 1. Beschrijf je ideale klant. Wie is ze? Wat doet ze? Hoe ziet haar leven eruit?',
    placeholder: 'Naomi, 35, fulltime kantoorbaan, net een Border Collie pup (Bowie) in huis. Ze houdt van haar hond, maar kan niet ontspannen werken of weg omdat Bowie in paniek raakt zodra zij de deur uitgaat.' },
  { key: 'v2', label: 'Vraag 2. Wat is het probleem waar ze nu mee zit? Kies een specifiek probleem waar jouw klant zich van bewust is.',
    placeholder: 'Bowie heeft verlatingsangst. Hij blaft, jankt en vernielt spullen zodra Naomi weg is. Naomi kan niet naar kantoor zonder schuldgevoel en stress, en voelt zich gevangen in haar eigen huis.' },
  { key: 'v3', label: 'Vraag 3. Wat heeft ze al geprobeerd dat niet werkte?',
    placeholder: 'Speelgoed, de tv aanlaten, een bench, korte stukjes weglopen. Niets hielp blijvend, want het pakte het gedrag aan (het blaffen) en niet de oorzaak (de paniek).' },
  { key: 'v4', label: 'Vraag 4. Hoe ziet het leven eruit als ze geen actie onderneemt? Beschrijf de situatie die ze wil voorkomen.',
    placeholder: 'Blijven leven rond de angst van de hond. Nooit meer onbezorgd weg kunnen, klachten van buren over het geblaf, een band met Bowie die verzuurt, en in het ergste geval afstand moeten doen van haar hond.' },
];

export const LEEG_ANTWOORDEN: DoelgroepAntwoorden = { v1: '', v2: '', v3: '', v4: '' };

export interface PromptResultaat {
  system: string;
  prompt: string;
}

export interface DoelgroepFeedback {
  perVraag: Partial<Record<keyof DoelgroepAntwoorden, string>>;
  score: number;
  totaaloordeel: string;
}

export function buildFeedback(a: DoelgroepAntwoorden): PromptResultaat {
  const system = `${CORRECT_NL}

Je bent een scherpe schrijfcoach voor ondernemers die hun ideale klant beschrijven.`;

  const antwoordenTekst = DOELGROEP_VRAGEN
    .map((v, i) => `Vraag ${i + 1}. ${v.label}\nAntwoord: ${a[v.key] || '(niet ingevuld)'}`)
    .join('\n\n');

  const prompt = `Beoordeel hoe concreet en visualiseerbaar deze antwoorden zijn op de volgende 4 vragen over de ideale klant:

${antwoordenTekst}

Een antwoord is concreet genoeg als je de klant voor je kunt zien of filmen: een naam, leeftijd, beroep, een concrete situatie, concreet gedrag. Vage termen of containerbegrippen (zoals "gestrest", "geen tijd", "overweldigd", "betere balans") zonder concrete invulling zijn niet concreet genoeg, ook al klinken ze logisch.

Geef per vraag specifieke feedback, en geef daarna een score en een totaaloordeel over de 4 antwoorden samen.

Geef je antwoord in exact dit format, zonder extra tekst ervoor of erna:
Vraag 1: [maximaal 2 zinnen. Is dit antwoord concreet en visualiseerbaar genoeg? Zo niet, benoem wat vager is en geef een concreet voorbeeld van hoe het scherper kan. Zo wel, geef een korte bevestiging waarom.]
Vraag 2: [zelfde aanpak als Vraag 1]
Vraag 3: [zelfde aanpak als Vraag 1]
Vraag 4: [zelfde aanpak als Vraag 1]
Score: [een heel cijfer van 1 tot 5 voor de 4 antwoorden samen, geen decimalen]
Totaaloordeel: [maximaal 3 zinnen: een samenvattend oordeel over hoe concreet en visualiseerbaar de ideale klant in zijn geheel naar voren komt]`;

  return { system, prompt };
}

/** Parseert de "Vraag N: ...", "Score: ..." en "Totaaloordeel: ..." structuur uit het AI-antwoord. */
export function parseFeedback(tekst: string): DoelgroepFeedback {
  const perVraag: Partial<Record<keyof DoelgroepAntwoorden, string>> = {};
  DOELGROEP_VRAGEN.forEach((v, i) => {
    const nummer = i + 1;
    const match = tekst.match(new RegExp(`Vraag ${nummer}:\\s*([\\s\\S]*?)(?=\\n\\s*(?:Vraag \\d+|Score|Totaaloordeel):|$)`, 'i'));
    if (match) perVraag[v.key] = match[1].trim();
  });

  const scoreMatch = tekst.match(/Score:\s*(\d+)/i);
  const totaalMatch = tekst.match(/Totaaloordeel:\s*([\s\S]*)/i);

  return {
    perVraag,
    score: scoreMatch ? Number(scoreMatch[1]) : 0,
    totaaloordeel: totaalMatch ? totaalMatch[1].trim() : '',
  };
}
