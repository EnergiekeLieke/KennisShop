'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { roepAnalyseAan, vervangMDashes } from '@/lib/huisstijl';
import {
  DOELGROEP_VRAGEN,
  LEEG_ANTWOORDEN,
  type DoelgroepAntwoorden,
  type DoelgroepFeedback,
  buildFeedback,
  parseFeedback,
} from '@/lib/doelgroepAnalysePrompts';

const DoelgroepAnalysePdfKnop = dynamic(
  () => import('./DoelgroepAnalysePdf').then((m) => m.DoelgroepAnalysePdfKnop),
  { ssr: false, loading: () => <span className="text-sm px-3 py-1.5 text-midGreen">PDF laden…</span> }
);

const STORAGE_KEY = 'doelgroep-analyse-v1';

interface OpgeslagenState {
  antwoorden: DoelgroepAntwoorden;
  feedback: DoelgroepFeedback | null;
}

export default function DoelgroepAnalyse() {
  const [antwoorden, setAntwoorden] = useState<DoelgroepAntwoorden>(LEEG_ANTWOORDEN);
  const [feedback, setFeedback] = useState<DoelgroepFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [fout, setFout] = useState('');

  const [geladen, setGeladen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const opgeslagen: OpgeslagenState = JSON.parse(raw);
        setAntwoorden({ ...LEEG_ANTWOORDEN, ...opgeslagen.antwoorden });
        setFeedback(opgeslagen.feedback ?? null);
      }
    } catch {
      // negeren, start leeg
    }
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (!geladen) return;
    const data: OpgeslagenState = { antwoorden, feedback };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [geladen, antwoorden, feedback]);

  const updateAntwoord = (key: keyof DoelgroepAntwoorden, value: string) => {
    setAntwoorden((prev) => ({ ...prev, [key]: value }));
  };

  const wis = () => {
    if (!confirm('Weet je zeker dat je deze analyse wilt wissen? Dit kan niet ongedaan worden gemaakt.')) return;
    localStorage.removeItem(STORAGE_KEY);
    setAntwoorden(LEEG_ANTWOORDEN);
    setFeedback(null);
  };

  const geefFeedback = async () => {
    setFeedbackLoading(true);
    setFout('');
    try {
      const { system, prompt } = buildFeedback(antwoorden);
      const controller = new AbortController();
      abortRef.current = controller;
      const tekst = await roepAnalyseAan(`${system}\n\n${prompt}`, 600, controller.signal);
      const geparst = parseFeedback(tekst);
      const perVraag: typeof geparst.perVraag = {};
      for (const key of Object.keys(geparst.perVraag) as (keyof DoelgroepAntwoorden)[]) {
        perVraag[key] = vervangMDashes(geparst.perVraag[key] ?? '');
      }
      setFeedback({
        perVraag,
        score: geparst.score,
        totaaloordeel: vervangMDashes(geparst.totaaloordeel),
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setFout(e instanceof Error ? e.message : 'Er ging iets mis');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-lightBg2 border-l-4 border-darkGreen rounded-xl px-4 py-3 text-sm text-darkSlate leading-relaxed">
        <span className="font-semibold text-darkGreen">Zo gebruik je dit: </span>
        Beschrijf je ideale klant zo concreet mogelijk. Je moet haar kunnen visualiseren of filmen, zo duidelijk moet je input zijn. Geen vage termen of containerbegrippen, maar duidelijke taal waarmee je klant zich direct aangesproken voelt. Klik daarna op &quot;Geef feedback&quot; voor een score en tips om scherper te worden.
      </div>

      <div className="text-center">
        <h1 className="font-salmon text-3xl text-darkSlate mb-1">Doelgroep analyse</h1>
        <p className="text-orange italic text-sm">Hoe concreet en visualiseerbaar is jouw ideale klant?</p>
      </div>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-lightBg">
        <h2 className="font-salmon text-xl text-darkSlate mb-4">De klant</h2>
        <div className="space-y-5">
          {DOELGROEP_VRAGEN.map((v) => (
            <div key={v.key}>
              <label className="block text-sm text-darkSlate mb-1.5">{v.label}</label>
              <textarea
                value={antwoorden[v.key]}
                onChange={(e) => updateAntwoord(v.key, e.target.value)}
                placeholder={v.placeholder}
                rows={3}
                className="w-full rounded-xl border border-lightBg p-3 text-sm text-darkSlate focus:outline-none focus:ring-2 focus:ring-darkGreen"
              />
              {feedback?.perVraag[v.key] && (
                <p className="mt-2 text-sm text-darkSlate bg-lightBg2 border border-lightBg rounded-xl p-3 leading-relaxed">
                  {feedback.perVraag[v.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-lightBg">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={geefFeedback}
              disabled={feedbackLoading}
              className="px-8 py-3 rounded-xl bg-darkGreen text-cream font-salmon text-lg hover:bg-darkGreen/90 transition-colors disabled:opacity-50"
            >
              {feedbackLoading ? 'Bezig…' : 'Geef feedback op mijn input'}
            </button>
            {fout && <p className="text-darkRed text-sm">{fout}</p>}
          </div>
          {feedback && (
            <div className="mt-4 bg-lightBg2 rounded-xl border border-lightBg p-4 flex gap-4 items-start">
              <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-salmon text-lg text-white ${
                feedback.score >= 4 ? 'bg-darkGreen' : feedback.score === 3 ? 'bg-orange' : 'bg-darkRed'
              }`}>
                {feedback.score || '?'}/5
              </div>
              <p className="text-sm text-darkSlate leading-relaxed">{feedback.totaaloordeel}</p>
            </div>
          )}
          {feedback && !feedbackLoading && (
            <div className="mt-4 flex justify-center">
              <DoelgroepAnalysePdfKnop antwoorden={antwoorden} feedback={feedback} />
            </div>
          )}
        </div>
      </section>

      <div className="text-center pt-2">
        <button onClick={wis} className="text-xs text-darkSlate/50 underline hover:text-darkSlate/70">
          Analyse wissen en opnieuw beginnen
        </button>
      </div>
    </div>
  );
}
