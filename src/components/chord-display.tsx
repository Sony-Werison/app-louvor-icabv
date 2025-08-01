
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
        // Exclude intensity markers from being treated as section headers
        if (isIntensityMarker(line)) {
            return false;
        }
        return true;
    }
    
    const sectionKeywords = ['intro', 'verso', 'refrão', 'ponte', 'solo', 'final', 'interlúdio', 'suave', 'forte'];
    // Check if the line *is* one of the keywords, optionally with a colon.
    const isKeyword = sectionKeywords.some(keyword => {
        const withColon = `${keyword}:`;
        return trimmed === keyword || trimmed === withColon;
    });

    // Ensure it doesn't contain chords, to avoid misinterpreting a line of chords as a section.
    const hasNotes = trimmed.match(/[a-g]/i) && !isKeyword;

    return isKeyword && !hasNotes;
};

const isIntensityMarker = (line: string) => {
    const trimmed = line.trim();
    return trimmed === '[+]' || trimmed === '[++]' || trimmed === '[+++]';
}

const getIntensityClass = (line: string) => {
    const trimmed = line.trim();
    switch(trimmed) {
        case '[+]': return 'bg-accent/30';
        case '[++]': return 'bg-accent/60';
        case '[+++]': return 'bg-accent/90';
        default: return '';
    }
}

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
        <div key={lineIndex} className="mb-2 leading-8">
            {parts.map((part, partIndex) => {
                const isLyricPart = !part.match(chordRegex);

                if (!isLyricPart) {
                    return null;
                }

                // Find the chord that should be paired with this lyric part.
                // It's the immediately preceding part if it's a chord.
                let chord = null;
                if (partIndex > 0) {
                    const previousPart = parts[partIndex - 1];
                    if (previousPart.match(chordRegex)) {
                        chord = previousPart.substring(1, previousPart.length - 1);
                    }
                }
                
                // If the first part is lyrics, it has no preceding chord.
                const hasPairedChord = chord !== null;
                const transposed = hasPairedChord ? transposeChord(chord, transposeBy) : '\u00A0'; // Non-breaking space
                
                return (
                    <div key={partIndex} className="inline-flex flex-col-reverse align-bottom">
                        <span className="leading-tight">{part}</span>
                        <b className={cn("text-primary font-bold leading-none", !hasPairedChord && "text-transparent")}>{transposed}</b>
                    </div>
                );
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
          <div key={`chord-line-${lineIndex}`} className="flex items-end mb-1">
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
        let wrapperClass = "mb-1";

        if (isIntensityMarker(currentLine)) {
            lineContent = (
                <div className={cn(
                    "inline-block font-bold text-accent-foreground rounded-md px-2 py-0.5 my-2 text-xs",
                    getIntensityClass(currentLine)
                )}>
                    {currentLine.replace(/[\[\]]/g, '')}
                </div>
            );
        } else if (isSectionHeader(currentLine)) {
            lineContent = (
                <div className="font-bold text-muted-foreground mt-4 mb-1">
                    {currentLine.replace(/[\[\]:]/g, '')}
                </div>
            );
            wrapperClass = ""; 
        } else if (isPureChordLineWithBrackets(currentLine) || isPureChordLineWithoutBrackets(currentLine)) {
            lineContent = renderPureChordLine(currentLine, i);
        } else if (currentLine.match(chordRegex)) {
            lineContent = renderTextWithChords(currentLine, i);
            wrapperClass="mb-4";
        } else {
            lineContent = (
                <div className={cn("leading-tight", !currentLine.trim() && "h-4")}>
                    {currentLine}
                </div>
            );
             if (currentLine.trim()) {
                wrapperClass="mb-4";
            }
        }
        
        elements.push(
            <div key={`line-wrapper-${i}`} className={wrapperClass}>
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
