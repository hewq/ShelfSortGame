export type ItemType = string | null;

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  matchCount: number;
  items: ItemType[][];
}

export interface SlotPosition {
  row: number;
  col: number;
}
