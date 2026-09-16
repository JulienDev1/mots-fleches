export type CellType = 'letter' | 'definition' | 'black';

export interface DefinitionData {
  text1: string;
  arrow1: 'right' | 'down' | 'right-down' | 'down-right';
  text2?: string;
  arrow2?: 'right' | 'down';
}

export interface CellData {
  id: string;
  type: CellType;
  value?: string;
  solution?: string;
  definition?: DefinitionData;
}

export type GridDifficulty = 'easy' | 'medium' | 'hard';

export interface UserSubscription {
  isSubscribed: boolean;
  freeGridsRemainingThisWeek: number;
}