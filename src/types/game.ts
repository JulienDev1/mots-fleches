import React from 'react';

// ==========================================
// 1. TYPES DU JEU & DE LA GRILLE
// ==========================================

export type CellType = 'lettre' | 'definition' | 'image' | 'noire';
export type Direction = 'horizontal' | 'vertical';

export interface DefinitionData {
  texte: string;
  direction: Direction;
}

export interface CellData {
  type: CellType;
  solution?: string;
  saisie?: string;
  definitions?: DefinitionData[];
  isError?: boolean;
}

export type GridMatrix = CellData[][];

// Type GrilleGeanteData pour la structure de données des grilles
export interface GrilleGeanteData {
  id: string;
  date?: string;
  difficulty?: DifficultyLevel;
  photo_url?: string;
  grid_data: GridMatrix;
  created_at?: string;
}

// Alias pour compatibilité
export type GridModel = GrilleGeanteData;

// ==========================================
// 2. TYPES NAVIGATION & BOUTONS DU MENU
// ==========================================

export type GameView = 'menu' | 'game';

export type DifficultyLevel = 'daily' | 'facile' | 'moyen' | 'difficile';

export type MenuButtonVariant = 
  | 'btn-orange' 
  | 'btn-green' 
  | 'btn-yellow' 
  | 'btn-red' 
  | 'btn-premium' 
  | 'btn-ia';

export interface MenuButtonConfig {
  id: DifficultyLevel | 'premium' | 'ia';
  label: string;
  subtitle?: string;
  variant: MenuButtonVariant;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

// ==========================================
// 3. TYPES PROPS DU COMPOSANT GRILLE GEANTE
// ==========================================

export interface GrilleGeanteProps {
  onBack?: () => void;
  isPremium?: boolean;
  difficulty?: DifficultyLevel;
}

// ==========================================
// 4. TYPES USER, QUOTA & SSO SUPABASE
// ==========================================

export interface UserQuota {
  date: string;
  count: number;
}

export interface QuotaCheckResult {
  canPlay: boolean;
  remaining: number;
}

export interface UserProgress {
  id?: string;
  user_id: string;
  grid_id: string;
  state: GridMatrix;
  is_won?: boolean;
  updated_at?: string;
}

export interface SSOSessionParams {
  access_token: string | null;
  refresh_token: string | null;
}