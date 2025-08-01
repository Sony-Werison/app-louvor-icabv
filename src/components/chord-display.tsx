
'use client';

import { cn } from "@/lib/utils";

interface ChordDisplayProps {
  chordsText: string;
}

const chordRegex = /(\[.*?\])/g;

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
  
  const isSectionHeader = (line: string) => {
    const trimmed = line.trim();
    return (
        trimmed.startsWith('[') &&
        trimmed.endsWith(']') &&
        !trimmed.substring(1, trimmed.length-1).includes('[')
    );
  };
  
  const isJustChordsLine = (line: string) => {
     if (!line.trim().startsWith('[')) return false;
     
     const parts = line.split(chordRegex).filter(p => p.trim() !== '');
     return parts.every(p => p.match(chordRegex));
  };


  return (
    <div className="font-code text-base leading-relaxed">
      {lines.map((line, lineIndex) => {

        if (isSectionHeader(line)) {
           const sectionName = line.substring(1, line.length - 1);
           const isChordLine = /^[A-Ga-g](#|b|sus|maj|min|aug|dim|\d|\/|\s)*$/.test(sectionName) && sectionName.length > 0;
           
           if (!isChordLine) {
            return (
                <div key={lineIndex} className="font-bold text-muted-foreground mt-4 mb-2">
                    {sectionName}
                </div>
            );
           }
        }
        
        if (isJustChordsLine(line)) {
            return renderTextWithChords(line, lineIndex);
        }

        const hasLyricsAndChords = line.match(chordRegex);

        if (hasLyricsAndChords) {
          return renderTextWithChords(line, lineIndex);
        }
        
        return (
          <div key={lineIndex} className={cn(!line.trim() && "h-4")}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
