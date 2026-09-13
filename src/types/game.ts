export type Direction = 'horizontal' | 'vertical';

export interface Definition {
  id: string;
  texte: string;
  ligne: number;    // Position Y dans la grille
  colonne: number;  // Position X dans la grille
  direction: Direction;
  numero: number;
}

export interface Cellule {
  type: 'lettre' | 'definition' | 'noire';
  solution?: string;      // La lettre attendue (ex: "A")
  saisie?: string;        // La lettre saisie par le joueur
  definitions?: {         // Utilisé si type === 'definition'
    texte: string;
    direction: Direction;
  }[];
}

export interface CelluleGeante {
  type: 'lettre' | 'definition' | 'noire' | 'image';
  solution?: string;
  saisie?: string;
  definitions?: { texte: string; direction: 'horizontal' | 'vertical' | 'diagonale' }[];
}

export type GrilleGeanteData = CelluleGeante[][];