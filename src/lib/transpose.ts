

const notesSharp = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const notesFlat = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

const transposeNote = (note: string, amount: number): string => {
  const isSharp = note.endsWith('#');
  const isFlat = note.endsWith('b');
  const baseNote = note.substring(0, isSharp || isFlat ? note.length - 1 : note.length);

  const sourceScale = isFlat ? notesFlat : notesSharp;
  const targetScale = notesSharp; // Always transpose to sharps for simplicity, can be configured

  let index = sourceScale.indexOf(note);
  if (index === -1) {
    index = sourceScale.indexOf(baseNote);
    if(index === -1) return note; // Not a transposable note
  }
  
  let newIndex = (index + amount) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }
  
  return targetScale[newIndex];
};


export const transposeChord = (chord: string, amount: number): string => {
  if (amount === 0) return chord;

  const chordMatch = chord.match(/^([A-G][b#]?)(.*)/);
  if (!chordMatch) {
    return chord; // Not a valid chord format
  }

  const [, note, rest] = chordMatch;
  const transposedNote = transposeNote(note, amount);
  
  return `${transposedNote}${rest}`;
};

export const getTransposedKey = (originalKey: string, amount: number): string => {
    if (amount === 0) return originalKey;
    return transposeChord(originalKey, amount);
}
