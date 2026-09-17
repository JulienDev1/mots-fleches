import React, { useState } from 'react';
import { GridSchema } from '../../services/gridService';

interface GridBoardProps {
  grid: GridSchema;
}

export const GridBoard: React.FC<GridBoardProps> = ({ grid }) => {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  const CELL_SIZE = 60; // Ajuste ici : 60, 70 ou 80px selon ton besoin de lecture

  const handleInputChange = (r: number, c: number, value: string) => {
    const char = String(value).slice(-1).toUpperCase();
    const key = `${r}-${c}`;
    setUserInputs((prev) => ({
      ...prev,
      [key]: char,
    }));
  };

  const matrix = Array.from({ length: grid.rows }, () =>
    Array.from({ length: grid.cols }, () => null as any)
  );

  return (
    <div className="w-full overflow-auto p-4 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl">
      <div
        className="grid gap-1 mx-auto bg-slate-800 p-2 rounded-xl"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${CELL_SIZE}px)`,
          width: 'max-content',
        }}
      >
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const boxStyle = { width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` };

            if (!cell || cell.type === 'black') {
              return (
                <div
                  key={key}
                  style={boxStyle}
                  className="bg-slate-900 border border-slate-950/40"
                />
              );
            }

            if (cell.type === 'definition') {
              const arrowSymbol = cell.def1?.arrow === 'down' ? '↓' : '→';
              return (
                <div
                  key={key}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    backgroundColor: '#f59e0b',
                    color: '#020617',
                    padding: '3px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid #d97706',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                  }}
                  title={cell.def1?.text}
                >
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      lineHeight: '1.1',
                      textTransform: 'uppercase',
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {cell.def1?.text}
                  </span>
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: '900',
                      alignSelf: 'flex-end',
                      lineHeight: '1',
                    }}
                  >
                    {arrowSymbol}
                  </span>
                </div>
              );
            }

            if (cell.type === 'letter') {
              const currentVal = userInputs[key] || '';

              return (
                <input
                  key={key}
                  type="text"
                  maxLength={1}
                  value={currentVal}
                  onChange={(e) => handleInputChange(r, c, e.target.value)}
                  ref={(el) => {
                    if (el) {
                      el.style.setProperty('font-size', '32px', 'important');
                      el.style.setProperty('font-weight', '900', 'important');
                      el.style.setProperty('text-align', 'center', 'important');
                      el.style.setProperty('color', '#0f172a', 'important');
                    }
                  }}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                    padding: 0,
                    margin: 0,
                  }}
                />
              );
            }

            return null;
          })
        )}
      </div>
    </div>
  );
};