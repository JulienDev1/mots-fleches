import type { GrilleGeanteData } from '../types/game';

export const mockGrille: GrilleGeanteData = [
  [
    { 
      type: 'definition', 
      definitions: [{ texte: 'Astre du jour', direction: 'horizontal' }] 
    },
    { type: 'lettre', solution: 'S' },
    { type: 'lettre', solution: 'O' },
  ],
  [
    { type: 'noire' },
    { type: 'lettre', solution: 'L' },
    { type: 'noire' },
  ],
  [
    { type: 'noire' },
    { type: 'noire' },
    { type: 'noire' },
  ]
];