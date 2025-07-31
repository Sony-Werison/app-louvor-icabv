'use client';

import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  chordsText: string;
}

// This regex finds a chord in brackets, like [G] or [Am7/C#]
const chordRegex = /\[([^\]]+)\]/g;

export function ChordDisplay({ chordsText }: ChordDisplayProps) {
  const lines = chordsText.split('\n');

  return (
    <div className="font-code text-base leading-relaxed">
      {lines.map((line, lineIndex) => {
        // Handle section headers like [Intro], [Verse], etc.
        const sectionMatch = line.trim().match(/^\[(.*)\]$/);
        if (sectionMatch && sectionMatch[1] && isNaN(parseInt(sectionMatch[1], 10)) && !sectionMatch[1].includes('/')) {
            // Check if it's not a chord (like [2x])
            const potentialChord = sectionMatch[1];
            if (!/^[A-Ga-g](#|b|sus|maj|min|aug|dim|\d)*/.test(potentialChord)) {
                 return (
                    <div key={lineIndex} className="font-bold text-muted-foreground mt-4 mb-2">
                        {line.trim()}
                    </div>
                );
            }
        }
        
        // Handle lines with chords and lyrics
        if (line.match(chordRegex)) {
          const parts = line.split(chordRegex);
          // `split` with a capturing group keeps the delimiters, so parts will be [lyric, chord, lyric, chord, ...]
          // e.g. " [G]hello [C]world" -> [" ", "G", "hello ", "C", "world"]
          
          return (
            <div key={lineIndex} className="flex flex-wrap items-end mb-4">
              {parts.map((part, partIndex) => {
                // An odd index means it's a chord (the captured group)
                if (partIndex % 2 === 1) {
                  return (
                    <div key={partIndex} className="relative h-6">
                       <b className="text-primary font-bold absolute bottom-full left-0 translate-y-1">
                         {part}
                       </b>
                    </div>
                  );
                }
                // An even index means it's a lyric part
                return (
                  <span key={partIndex} className="whitespace-pre">
                    {part}
                  </span>
                );
              })}
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
    