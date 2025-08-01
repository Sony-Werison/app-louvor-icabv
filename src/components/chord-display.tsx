
'use client';

import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  chordsText: string;
}

const chordRegex = /(\[.*?\])/g;
// Regex para acordes válidos
const validChordRegex = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|m|M|º|ª|\+|-|°|\/|\d)*$/;

const isLinePurelyChords = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Pega todas as partes entre colchetes
    const chords = trimmed.match(chordRegex);
    // Pega o texto fora dos colchetes
    const textOnly = trimmed.replace(chordRegex, '').trim();
    // Se não há acordes ou existe texto fora, não é uma linha de acordes
    if (!chords || textOnly) return false;
    
    // Verifica se tudo dentro dos colchetes parece um acorde válido
    return chords.every(part => {
        const chord = part.substring(1, part.length - 1);
        return chord === '' || validChordRegex.test(chord);
    });
};

const isSectionHeader = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Se a linha tem colchetes, verifica se NÃO é uma linha de acordes puros
    if (trimmed.includes('[') || trimmed.includes(']')) {
        return !isLinePurelyChords(trimmed);
    }
    
    // Se não tem colchetes, consideramos que é um cabeçalho de seção.
    // Isso cobre casos como "Intro", "suave", "+", etc.
    return true;
};

export function ChordDisplay({ chordsText }: ChordDisplayProps) {
  if (!chordsText) return null;

  const lines = chordsText.split('\n');

  const renderTextWithChords = (line: string, lineIndex: number) => {
    const parts = line.split(chordRegex).filter(Boolean);

    return (
      <div key={lineIndex} className="mb-4">
        {parts.map((part, partIndex) => {
          if (part.match(chordRegex)) {
            const chord = part.substring(1, part.length - 1);
            if (chord === '') {
              // Trata [] como um espaçamento
              return <span key={partIndex} className="inline-block w-8" />;
            }
            return (
              <span key={partIndex} className="relative inline-block h-6 px-1">
                <b className="text-primary font-bold absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                  {chord}
                </b>
              </span>
            );
          }
          return <span key={partIndex}>{part}</span>;
        })}
      </div>
    );
  };
  
  const renderPairedLines = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const currentLine = lines[i];
        
        if (isSectionHeader(currentLine) && !currentLine.includes('[')) {
            elements.push(
                <div key={`section-${i}`} className="font-bold text-muted-foreground mt-4 mb-2">
                    {currentLine}
                </div>
            );
            i++;
            continue;
        }

        if (isLinePurelyChords(currentLine)) {
            elements.push(renderTextWithChords(currentLine, i));
            i++;
            continue;
        }

        // Linha com letra e acordes embutidos
        if (currentLine.match(chordRegex)) {
            elements.push(renderTextWithChords(currentLine, i));
            i++;
            continue;
        }

        // Linha de letra normal
        elements.push(
            <div key={`lyrics-${i}`} className={cn(!currentLine.trim() && "h-4")}>
                {currentLine}
            </div>
        );
        i++;
    }
    return elements;
  }

  return (
    <div className="font-code text-base leading-relaxed">
      {renderPairedLines()}
    </div>
  );
}
