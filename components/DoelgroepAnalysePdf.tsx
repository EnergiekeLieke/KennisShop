'use client';

import dynamic from 'next/dynamic';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { K, gedeeldeStijlen as g, PdfHeader, PdfFooter, PdfSectieKop, TekstMetVet } from '@/lib/pdfHelpers';
import { DOELGROEP_VRAGEN, type DoelgroepAntwoorden, type DoelgroepFeedback } from '@/lib/doelgroepAnalysePrompts';

const s = StyleSheet.create({
  pagina:       { paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0, fontFamily: 'Helvetica', fontSize: 10, color: K.darkSlate, backgroundColor: K.wit },
  body:         { paddingHorizontal: 40 },
  vraagWrap:    { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: K.lightBg2 },
  vraagLabel:   { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: K.darkSlate, marginBottom: 5 },
  antwoordBox:  { backgroundColor: K.cream, borderRadius: 4, padding: 8, marginBottom: 6 },
  antwoordTekst:{ fontSize: 9, color: K.darkSlate, lineHeight: 1.5 },
  feedbackLabel:{ fontSize: 7.5, color: K.midGreen, letterSpacing: 1, marginBottom: 3, fontFamily: 'Helvetica-Bold' },
  scoreWrap:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14 },
  scoreCirkel:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scoreCijfer:  { fontFamily: 'Helvetica-Bold', fontSize: 13, color: K.wit },
  totaalTekst:  { fontSize: 9.5, color: K.darkSlate, lineHeight: 1.6, flex: 1 },
});

interface Props {
  antwoorden: DoelgroepAntwoorden;
  feedback: DoelgroepFeedback | null;
}

function scoreKleur(score: number) {
  if (score >= 4) return K.darkGreen;
  if (score === 3) return K.orange;
  return K.darkRed;
}

function DoelgroepAnalyseDocument({ antwoorden, feedback }: Props) {
  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document title="Doelgroep analyse" author="Energieke Lieke">
      <Page size="A4" style={s.pagina}>
        <PdfHeader titel="Doelgroep analyse" datum={datum} />
        <View style={g.headerSpacer} fixed />
        <View style={s.body}>
          <PdfSectieKop titel="DE KLANT" />
          {DOELGROEP_VRAGEN.map((v) => (
            <View key={v.key} style={s.vraagWrap} wrap={false}>
              <Text style={s.vraagLabel}>{v.label}</Text>
              <View style={s.antwoordBox}>
                <Text style={s.antwoordTekst}>{antwoorden[v.key] || '(niet ingevuld)'}</Text>
              </View>
              {feedback?.perVraag[v.key] && (
                <>
                  <Text style={s.feedbackLabel}>FEEDBACK</Text>
                  <TekstMetVet tekst={feedback.perVraag[v.key]!} />
                </>
              )}
            </View>
          ))}

          {feedback && (
            <>
              <PdfSectieKop titel="TOTAALOORDEEL" />
              <View style={s.scoreWrap}>
                <View style={[s.scoreCirkel, { backgroundColor: scoreKleur(feedback.score) }]}>
                  <Text style={s.scoreCijfer}>{feedback.score || '?'}/5</Text>
                </View>
                <Text style={s.totaalTekst}>{feedback.totaaloordeel}</Text>
              </View>
            </>
          )}
        </View>
        <PdfFooter titel="Doelgroep analyse" />
      </Page>
    </Document>
  );
}

function DoelgroepAnalysePdfKnopInner(props: Props) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFDownloadLink } = require('@react-pdf/renderer');
  return (
    <PDFDownloadLink document={<DoelgroepAnalyseDocument {...props} />} fileName="doelgroep-analyse.pdf">
      {({ loading }: { loading: boolean }) => (
        <span className="text-sm px-3 py-1.5 rounded-lg bg-darkGreen text-white hover:bg-darkGreen/80 transition-colors cursor-pointer inline-block">
          {loading ? 'PDF voorbereiden…' : 'Download als PDF'}
        </span>
      )}
    </PDFDownloadLink>
  );
}

export const DoelgroepAnalysePdfKnop = dynamic(
  () => Promise.resolve(DoelgroepAnalysePdfKnopInner),
  { ssr: false, loading: () => <span className="text-sm px-3 py-1.5 text-midGreen">PDF laden…</span> }
);
