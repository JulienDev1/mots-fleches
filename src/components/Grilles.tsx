import React, { useRef } from 'react';

export const Grilles: React.FC = () => {
  // Utilisation de la ref pour stocker les éléments d'entrée
  const inputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Handler de changement de saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const val = e.target.value.toUpperCase();
    console.log(`Saisie sur la case ${key} :`, val);
  };

  return (
    <div className="grilles-container">
      {/* Exemple d'association sur ton composant/input */}
      <input
        ref={(el) => { inputsRef.current['case-0'] = el; }}
        onChange={(e) => handleInputChange(e, 'case-0')}
        maxLength={1}
      />
    </div>
  );
};