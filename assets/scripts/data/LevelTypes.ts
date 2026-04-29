export type ItemType = string | null;

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  matchCount: number;
  items: ItemType[][];
  moveLimit?: number;

  // 星级评价
  threeStarMoves?: number;
  twoStarMoves?: number;
}

export interface SlotPosition {
  row: number;
  col: number;
}
