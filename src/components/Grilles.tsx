import React, { useState, useRef } from 'react';
import type { GrilleGeanteData } from '../types/game';
import './Grille.css';

interface GrilleProps {
  data: GrilleGeanteData;
}

export const Grille: React.FC<GrilleProps> = ({ data }) => {
  const [grid, setGrid] = useState<GrilleGeanteData>(data);
  const inputsRef = useRef<(HTMLInputElement | null)[][]>(
    data.map(row => row.map(() => null))
  );

  const handleInputChange = (r: number, c: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    const newGrid = [...grid];
    newGrid[r][c] = { ...newGrid[r][c], saisie: char };
    setGrid(newGrid);
  };

  return (
    <div className="grille-container">
      {/* Rendu de la grille */}
    </div>
  );
};