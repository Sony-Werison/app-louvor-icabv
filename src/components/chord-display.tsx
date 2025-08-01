
'use client';

import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  chordsText: string;
}

// This regex finds a chord in brackets, like [G] or [Am7/C#]
const chordRegex = /(\[[^\]]+\])/g;

export function ChordDisplay({ chordsText }: ChordDisplayProps) {
  const lines = chordsText.split('\n');

  return (
    <div className="font-code text-base leading-relaxed">
      {lines.map((line, lineIndex) => {
        const parts = line.split(chordRegex).filter(Boolean); // filter(Boolean) removes empty strings

        // A line is a section header if it ONLY contains bracketed content, like [Intro] or [Chorus]
        const isSectionHeader = parts.length > 0 && parts.every(p => p.match(chordRegex)) && !line.includes(' ');

        if (isSectionHeader) {
            const content = parts.join(' ').trim();
            // Test if it's a "musical direction" vs a line of just chords
            const isJustChords = content.replace(/\[|\]/g, '').split(' ').every(c => /^[A-Ga-g](#|b|sus|maj|min|aug|dim|\d|\/)+$/.test(c));
            
            if (!isJustChords) {
                return (
                    <div key={lineIndex} className="font-bold text-muted-foreground mt-4 mb-2">
                        {content}
                    </div>
                );
            }
        }

        const hasChords = line.match(chordRegex);

        if (hasChords) {
          // This logic handles lines with interspersed lyrics and chords
          let lineElements: React.ReactNode[] = [];
          let currentLyrics = "";

          const flushLyrics = (key: string) => {
            if (currentLyrics) {
              lineElements.push(<span key={key}>{currentLyrics}</span>);
              currentLyrics = "";
            }
          };

          parts.forEach((part, partIndex) => {
            if (part.match(chordRegex)) {
              flushLyrics(`lyric-${partIndex}`);
              lineElements.push(
                <div key={`chord-${partIndex}`} className="relative inline-block h-6">
                   <b className="text-primary font-bold absolute bottom-full left-0 translate-y-1 whitespace-nowrap">
                     {part.substring(1, part.length - 1)}
                   </b>
                </div>
              );
            } else {
              currentLyrics += part;
            }
          });

          flushLyrics('lyric-last');

          return (
            <div key={lineIndex} className="flex flex-wrap items-end mb-4">
              {lineElements}
            </div>
          );
        }

        // Handle lines with only lyrics or empty lines
        return (
          <div key={lineIndex} className={cn(!line.trim() && "h-4")}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
    