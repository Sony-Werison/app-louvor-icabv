
'use client';

import { cn } from "@/lib/utils";
import { transposeChord } from "@/lib/transpose";

interface ChordDisplayProps {
  chordsText: string;
  transposeBy?: number;
}

const chordRegex = /(\[.*?\])/g;

const isLinePurelyChords = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const chords = trimmed.match(chordRegex);
    const textOnly = trimmed.replace(chordRegex, '').trim();
    if (!chords || textOnly) return false;
    
    return chords.every(part => {
        const chord = part.substring(1, part.length - 1);
        return true; 
    });
};

const isSectionHeader = (line: string) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return true;
    }

    const sectionKeywords = ['intro', 'verso', 'refrão', 'ponte', 'solo', 'final', 'interlúdio', 'suave', 'forte', '+', '++', '+++'];
    return sectionKeywords.some(keyword => trimmed.includes(keyword)) && !trimmed.match(/[a-gA-G]/);
};


export function ChordDisplay({ chordsText, transposeBy = 0 }: ChordDisplayProps) {
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
              return <span key={partIndex} className="inline-block w-8" />;
            }
            const transposed = transposeChord(chord, transposeBy);
            return (
              <span key={partIndex} className="relative inline-block h-4 px-1">
                <b className="text-primary font-bold absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                  {transposed}
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
        
        if (isSectionHeader(currentLine)) {
            elements.push(
                <div key={`section-${i}`} className="font-bold text-muted-foreground mt-6 mb-2">
                    {currentLine.replace(/[\[\]]/g, '')}
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

        if (currentLine.match(chordRegex)) {
            elements.push(renderTextWithChords(currentLine, i));
            i++;
            continue;
        }

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
    <pre className="whitespace-pre-wrap font-code text-base leading-relaxed">
      {renderPairedLines()}
    </pre>
  );
}
