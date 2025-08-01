
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

    // A line is a pure chord line if it consists ONLY of chords and hyphens, with no other text.
    const sanitized = trimmed.replace(unbracketedChordRegex, '').replace(/-/g, '').replace(/\s/g, '');
    return sanitized.trim() === '';
}


export function ChordDisplay({ chordsText, transposeBy = 0 }: ChordDisplayProps) {
  if (!chordsText) return null;

  const lines = chordsText.split('\n');

  const renderTextWithChords = (line: string, lineIndex: number) => {
    const parts = line.split(chordRegex).filter(Boolean);

    return (
      <div key={lineIndex} className="flex flex-wrap items-end leading-none">
        {parts.map((part, partIndex) => {
          if (part.match(chordRegex)) {
            const chord = part.substring(1, part.length - 1);
            if (chord === '') {
              // This is a space chord like `[]` over a space in lyrics.
              // We'll let the lyric part handle the space.
              return null;
            }
            const transposed = transposeChord(chord, transposeBy);
            return (
               // This is a chord associated with the *next* part of the lyrics
               // We render it now, but it will be visually placed above the upcoming text.
              <b key={partIndex} className="flex flex-col items-center self-end h-full">
                <span className="text-primary font-bold whitespace-nowrap">
                  {transposed}
                </span>
                <span className="opacity-0 select-none">-</span>
              </b>
            );
          }
          // This is a piece of lyric
          return <span key={partIndex} className="leading-tight">{part}</span>;
        })}
      </div>
    );
  };

  const renderPureChordLine = (line: string, lineIndex: number) => {
      let parts: string[] = [];
      if (isPureChordLineWithBrackets(line)) {
          parts = line.split(chordRegex).filter(Boolean);
      } else if (isPureChordLineWithoutBrackets(line)) {
          const chordOrHyphenRegex = new RegExp(`${unbracketedChordRegex.source}|-+`, 'g');
          parts = line.match(chordOrHyphenRegex) || [];
      }
      
      return (
          <div key={`chord-line-${lineIndex}`} className="flex items-end">
              {parts.map((part, index) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    const chord = part.substring(1, part.length - 1);
                    if (chord) {
                        const transposed = transposeChord(chord, transposeBy);
                        return (
                            <b key={index} className="text-primary font-bold px-1">
                                {transposed}
                            </b>
                        );
                    }
                    return <span key={index} className="inline-block w-4">&nbsp;</span>;
                  }
                  
                  if (part.startsWith('-')) {
                      return part.split('').map((_, i) => <span key={`${index}-${i}`} className="inline-block" style={{width: '0.75ch'}}>&nbsp;</span>);
                  }

                  if (part) {
                      const transposed = transposeChord(part, transposeBy);
                      return (
                          <b key={index} className="text-primary font-bold px-1">
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
        
        let lineContent: React.ReactNode;

        if (isSectionHeader(currentLine)) {
            lineContent = (
                <div className="font-bold text-muted-foreground mt-4 mb-1">
                    {currentLine.replace(/[\[\]:]/g, '')}
                </div>
            );
        } else if (isPureChordLineWithBrackets(currentLine) || isPureChordLineWithoutBrackets(currentLine)) {
            lineContent = renderPureChordLine(currentLine, i);
        } else if (currentLine.match(chordRegex)) {
            lineContent = renderTextWithChords(currentLine, i);
        } else {
            lineContent = (
                <div className={cn("leading-tight", !currentLine.trim() && "h-4")}>
                    {currentLine}
                </div>
            );
        }
        
        elements.push(
            <div key={`line-wrapper-${i}`} className="pt-2 mb-4">
                {lineContent}
            </div>
        );

        i++;
    }
    return elements;
  }

  return (
    <pre className="whitespace-pre-wrap font-code" style={{whiteSpace: 'pre-wrap'}}>
      {renderPairedLines()}
    </pre>
  );
}
