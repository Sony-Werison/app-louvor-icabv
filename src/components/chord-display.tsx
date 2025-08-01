
'use client';

import { cn } from "@/lib/utils";
import { transposeChord } from "@/lib/transpose";

interface ChordDisplayProps {
  chordsText: string;
  transposeBy?: number;
}

const chordRegex = /(\[.*?\])/g;
const simpleChordRegex = /([A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|m|M|º|ª|\+|-|°|\/|\d)*)/g;


const isLinePurelyChords = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Test if the line contains only valid chord characters and spaces.
    // This regex allows chord names, numbers, slashes for bass notes, and spaces.
    return /^[A-G#bmsuadigc\d\s\/\(\)]+$/.test(trimmed) && /[A-G]/.test(trimmed) && !trimmed.match(/[H-Z]/i);
};

const isSectionHeader = (line: string) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return true;
    }

    const sectionKeywords = ['intro', 'verso', 'refrão', 'ponte', 'solo', 'final', 'interlúdio', 'suave', 'forte', '+', '++', '+++'];
    // Check if the trimmed line is one of the keywords, possibly with a colon
    return sectionKeywords.some(keyword => trimmed === keyword || trimmed === `${keyword}:`) && !trimmed.match(/[a-g]/i);
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

  const renderPureChordLine = (line: string, lineIndex: number) => {
      const chords = line.trim().split(/\s+/);
      return (
          <div key={`chord-line-${lineIndex}`} className="flex gap-4 mb-2">
              {chords.map((chord, chordIndex) => (
                  <b key={chordIndex} className="text-primary font-bold">
                      {transposeChord(chord, transposeBy)}
                  </b>
              ))}
          </div>
      );
  }
  
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
            elements.push(renderPureChordLine(currentLine, i));
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
