
'use client';

import { cn } from "@/lib/utils";
import { transposeChord } from "@/lib/transpose";

interface ChordDisplayProps {
  chordsText: string;
  transposeBy?: number;
}

const chordRegex = /(\[.*?\])/g;

const isSectionHeader = (line: string) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return true;
    }
    
    const sectionKeywords = ['intro', 'verso', 'refrão', 'ponte', 'solo', 'final', 'interlúdio', 'suave', 'forte', '+', '++', '+++'];
    return sectionKeywords.some(keyword => {
        const withColon = `${keyword}:`;
        return trimmed === keyword || trimmed === withColon;
    }) && !trimmed.match(/[a-g]/i);
};

const isPureChordLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Check if the line consists only of bracketed chords `[C]` or spaces `[]`
  const sanitized = trimmed.replace(chordRegex, '');
  return sanitized.trim() === '';
};


export function ChordDisplay({ chordsText, transposeBy = 0 }: ChordDisplayProps) {
  if (!chordsText) return null;

  const lines = chordsText.split('\n');

  const renderTextWithChords = (line: string, lineIndex: number) => {
    const parts = line.split(chordRegex).filter(Boolean);

    return (
      <div key={lineIndex} className="mb-4 leading-normal">
        {parts.map((part, partIndex) => {
          if (part.match(chordRegex)) {
            const chord = part.substring(1, part.length - 1);
            if (chord === '') {
              // This case should be handled by renderPureChordLine, but as a fallback:
              return <span key={partIndex} className="inline-block w-2" />;
            }
            const transposed = transposeChord(chord, transposeBy);
            return (
              <span key={partIndex} className="relative inline-block h-4 px-px align-bottom">
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
      const parts = line.split(chordRegex).filter(Boolean);
      return (
          <div key={`chord-line-${lineIndex}`} className="flex items-end gap-x-1 mb-4 leading-normal">
              {parts.map((part, index) => {
                  const chord = part.substring(1, part.length - 1);
                  if (chord) {
                      const transposed = transposeChord(chord, transposeBy);
                      return (
                          <b key={index} className="text-primary font-bold">
                              {transposed}
                          </b>
                      );
                  }
                  // Render a non-breaking space for empty brackets `[]` to maintain spacing
                  return <span key={index} className="inline-block w-3">&nbsp;</span>;
              })}
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
                    {currentLine.replace(/[\[\]:]/g, '')}
                </div>
            );
            i++;
            continue;
        }
        
        if (isPureChordLine(currentLine)) {
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
            <div key={`lyrics-${i}`} className={cn("leading-normal", !currentLine.trim() && "h-4")}>
                {currentLine}
            </div>
        );
        i++;
    }
    return elements;
  }

  return (
    <pre className="whitespace-pre-wrap font-code text-base">
      {renderPairedLines()}
    </pre>
  );
}
