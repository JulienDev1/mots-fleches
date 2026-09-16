import React from 'react';
import { CellData } from '../../types/grid';

interface GridCellProps {
  cell: CellData;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onChange?: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}

export const GridCell: React.FC<GridCellProps> = ({
  cell,
  isSelected,
  isHighlighted,
  onChange,
  onKeyDown,
  inputRef,
}) => {
  if (cell.type === 'black') {
    return <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }} />;
  }

  if (cell.type === 'definition') {
    const renderArrow = (dir?: string) => {
      switch (dir) {
        case 'right': return '➔';
        case 'down': return '⬇';
        case 'right-down': return '↳';
        case 'down-right': return '⬎';
        default: return '➔';
      }
    };

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f59e0b',
          color: '#ffffff',
          fontSize: '7px',
          lineHeight: '1.1',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {cell.definition?.text1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{cell.definition.text1}</span>
            <span style={{ fontSize: '9px' }}>{renderArrow(cell.definition.arrow1)}</span>
          </div>
        )}
        {cell.definition?.text2 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.4)', paddingTop: '1px' }}>
            <span>{cell.definition.text2}</span>
            <span style={{ fontSize: '9px' }}>{renderArrow(cell.definition.arrow2)}</span>
          </div>
        )}
      </div>
    );
  }

  // Case Lettre
  let bg = '#ffffff';
  if (isSelected) bg = '#bae6fd';
  else if (isHighlighted) bg = '#e0f2fe';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={1}
        value={cell.value || ''}
        onChange={(e) => onChange && onChange(e.target.value.toUpperCase())}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          backgroundColor: 'transparent',
          textTransform: 'uppercase',
          padding: 0,
          margin: 0,
          color: cell.value && cell.solution && cell.value !== cell.solution ? '#dc2626' : '#0f172a',
        }}
      />
    </div>
  );
};

export default GridCell;