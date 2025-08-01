
'use client';

import { cn } from "@/lib/utils";
import { transposeChord } from "@/lib/transpose";

interface ChordDisplayProps {
  chordsText: string;
  transposeBy?: number;
}

const chordRegex = /(\[.*?\])/g;
// Regex to find chords in a string. It's not perfect but covers most cases.
// It looks for a capital letter A-G, followed by optional 'b' or '#',
// and then a series of common chord modifiers like 'm', 'maj', 'sus', 'dim', 'aug', 'add', 'M', 'º', '°', etc.
// Note: The forward slash '/' is escaped as '\/'.
const unbracketedChordRegex = /([A-G][b#]?(?:m|maj|sus|dim|aug|add|M|º|°|\/)?\d*(?:sus\d*|add\d*|maj\d*)?(?:[b#]\d{1,2})?)/g;


const isSectionHeader = (line: string) => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return true;
    }
    
    const sectionKeywords = ['intro', 'verso', 'refrão', 'ponte', 'solo', 'final', 'interlúdio', 'suave', 'forte', '+', '++', '+++'];
    // Check if the line *is* one of the keywords, optionally with a colon.
    const isKeyword = sectionKeywords.some(keyword => {
        const withColon = `${keyword}:`;
        return trimmed === keyword || trimmed === withColon;
    });

    // Ensure it doesn't contain chords, to avoid misinterpreting a line of chords as a section.
    const hasNotes = trimmed.match(/[a-g]/i) && !isKeyword;

    return isKeyword && !hasNotes;
};

const isPureChordLineWithBrackets = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Check if the line consists only of bracketed chords `[C]` or spaces `[]`
  const sanitized = trimmed.replace(chordRegex, '');
  return sanitized.trim() === '';
};

const isPureChordLineWithoutBrackets = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || line.includes('[') || line.includes(']')) return false;

    // Check if every word in the line is a valid chord or a hyphen.
    const words = trimmed.split(/\s+/);
    const chordAloneRegex = new RegExp(`^${unbracketedChordRegex.source}$`);
    return words.every(word => word === '-' || word.match(chordAloneRegex));
}


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
      let parts: string[] = [];
      if (isPureChordLineWithBrackets(line)) {
          parts = line.split(chordRegex).filter(Boolean);
      } else if (isPureChordLineWithoutBrackets(line)) {
          parts = line.trim().split(/\s+/);
      }
      
      return (
          <div key={`chord-line-${lineIndex}`} className="flex items-end gap-x-4 mb-4 leading-normal">
              {parts.map((part, index) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
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
                  }
                  
                  if (part === '-') {
                      return <span key={index} className="inline-block w-3 text-muted-foreground">&ndash;</span>;
                  }

                  if (part) {
                      const transposed = transposeChord(part, transposeBy);
                      return (
                          <b key={index} className="text-primary font-bold">
                              {transposed}
                          </b>
                      );
                  }
                  return null;
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
        
        if (isPureChordLineWithBrackets(currentLine) || isPureChordLineWithoutBrackets(currentLine)) {
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
