import { _decorator, Component, Prefab, instantiate, Vec3 } from "cc";
import { Slot } from "./Slot";
import { Item } from "./Item";
import { LevelConfig, ItemType } from "../data/LevelTypes";
import { GameUI } from "../ui/GameUI";
import { LevelManager } from "../core/LevelManager";
import { AdManager } from "../core/AdManager";
import { SaveManager } from "../core/SaveManager";

const { ccclass, property } = _decorator;

@ccclass("Shelf")
export class Shelf extends Component {
  @property(Prefab)
  public slotPrefab: Prefab | null = null;

  @property(Prefab)
  public itemPrefab: Prefab | null = null;

  @property(GameUI)
  public gameUI: GameUI | null = null;

  @property
  public rows: number = 4;

  @property
  public cols: number = 4;

  @property
  public slotSize: number = 120;

  @property
  public gap: number = 16;

  private slots: Slot[][] = [];
  private matchCount: number = 3;
  private currentLevelId: number = 1;
  private currentLevelConfig: LevelConfig | null = null;
  private isLevelEnded: boolean = false;
  private historyStack: ItemType[][][] = [];
  private maxHistoryCount: number = 10;
  private moveLimit: number = 0;
  private moveCount: number = 0;
  private threeStarMoves: number = 0;
  private twoStarMoves: number = 0;
  private totalLevelCount: number = 4;

  start() {
    if (this.gameUI) {
      this.gameUI.setStartCallback(() => {
        this.startSavedLevel();
      });

      this.gameUI.setOpenLevelSelectCallback(() => {
        this.openLevelSelect();
      });

      this.gameUI.setSelectLevelCallback((levelId: number) => {
        this.selectLevel(levelId);
      });

      this.gameUI.setRestartCallback(() => {
        this.restartLevel();
      });

      this.gameUI.setNextCallback(() => {
        this.nextLevel();
      });

      this.gameUI.setUndoCallback(() => {
        this.undoLastMove();
      });

      this.gameUI.setReviveCallback(() => {
        this.reviveByAd();
      });

      this.gameUI.setResetSaveCallback(() => {
        this.resetSave();
      });

      this.gameUI.showHome();
    }
  }

  public async resetSave() {
    SaveManager.clearSave();
    this.currentLevelId = 1;

    if (this.gameUI) {
      this.gameUI.hideResult();
    }

    try {
      await this.loadLevelById(1);
    } catch (error) {
      console.error("Reset save failed: load level 1 error", error);
    }
  }

  private async loadLevelById(levelId: number) {
    const config = await LevelManager.loadLevel(levelId);
    this.currentLevelId = levelId;
    this.loadLevel(config);
  }

  private startSavedLevel() {
    this.currentLevelId = SaveManager.getCurrentLevel();

    if (this.gameUI) {
      this.gameUI.showGame();
    }

    this.loadLevelById(this.currentLevelId).catch((error) => {
      console.warn(
        `Saved level ${this.currentLevelId} not found, back to level 1`,
        error,
      );

      this.currentLevelId = 1;
      SaveManager.saveCurrentLevel(1);

      this.loadLevelById(1).catch((innerError) => {
        console.error("Load level 1 failed", innerError);
      });
    });
  }

  private openLevelSelect() {
    if (!this.gameUI) {
      return;
    }

    this.gameUI.buildLevelButtons(this.totalLevelCount, (levelId: number) => {
      return SaveManager.getLevelStars(levelId);
    });

    this.gameUI.showLevelSelect();
  }

  private selectLevel(levelId: number) {
    if (this.gameUI) {
      this.gameUI.showGame();
    }

    this.loadLevelById(levelId).catch((error) => {
      console.error(`Select level ${levelId} failed`, error);
    });
  }

  private clearBoard() {
    this.node.removeAllChildren();
    this.slots = [];
  }

  public loadLevel(config: LevelConfig) {
    this.currentLevelConfig = config;
    this.isLevelEnded = false;
    this.historyStack = [];

    this.rows = config.rows;
    this.cols = config.cols;
    this.matchCount = config.matchCount;
    this.moveLimit = config.moveLimit ?? 0;
    this.moveCount = 0;
    this.threeStarMoves = config.threeStarMoves ?? 0;
    this.twoStarMoves = config.twoStarMoves ?? 0;

    if (this.gameUI) {
      const bestStars = SaveManager.getLevelStars(config.id);

      this.gameUI.setLevel(config.id, bestStars);
      this.gameUI.setMoveCount(this.moveCount);
      this.gameUI.hideResult();
    }

    this.createSlots();
    this.createItems(config.items);
  }

  private calculateStars(): number {
    if (this.threeStarMoves > 0 && this.moveCount <= this.threeStarMoves) {
      return 3;
    }

    if (this.twoStarMoves > 0 && this.moveCount <= this.twoStarMoves) {
      return 2;
    }

    return 1;
  }

  public async restartLevel() {
    if (this.gameUI) {
      this.gameUI.hideResult();
    }

    try {
      await this.loadLevelById(this.currentLevelId);
    } catch (error) {
      console.error(`Restart level ${this.currentLevelId} failed`, error);
    }
  }

  public async nextLevel() {
    const nextLevelId = this.currentLevelId + 1;

    if (this.gameUI) {
      this.gameUI.hideResult();
    }

    try {
      await this.loadLevelById(nextLevelId);
      SaveManager.saveCurrentLevel(nextLevelId);
    } catch (error) {
      console.warn(`Level ${nextLevelId} not found, back to level 1`);

      await this.loadLevelById(1);
      SaveManager.saveCurrentLevel(1);
    }
  }

  private createSlots() {
    if (!this.slotPrefab) {
      console.error("Slot prefab is not assigned");
      return;
    }

    this.node.removeAllChildren();
    this.slots = [];

    const totalWidth = this.cols * this.slotSize + (this.cols - 1) * this.gap;
    const totalHeight = this.rows * this.slotSize + (this.rows - 1) * this.gap;

    const startX = -totalWidth / 2 + this.slotSize / 2;
    const startY = totalHeight / 2 - this.slotSize / 2;

    for (let row = 0; row < this.rows; row++) {
      this.slots[row] = [];

      for (let col = 0; col < this.cols; col++) {
        const slotNode = instantiate(this.slotPrefab);
        slotNode.parent = this.node;

        const x = startX + col * (this.slotSize + this.gap);
        const y = startY - row * (this.slotSize + this.gap);

        slotNode.setPosition(new Vec3(x, y, 0));

        const slot = slotNode.getComponent(Slot);
        if (!slot) {
          console.error("Slot component not found on Slot prefab");
          continue;
        }

        slot.init(row, col);
        this.slots[row][col] = slot;
      }
    }
  }

  private createItems(items: ItemType[][]) {
    for (let row = 0; row < items.length; row++) {
      for (let col = 0; col < items[row].length; col++) {
        const itemType = items[row][col];

        if (!itemType) {
          continue;
        }

        const slot = this.slots[row]?.[col];

        if (!slot) {
          continue;
        }

        this.createItemAtSlot(itemType, slot);
      }
    }
  }

  private createItemAtSlot(itemType: string, slot: Slot) {
    if (!this.itemPrefab) {
      console.error("Item prefab is not assigned");
      return;
    }

    const itemNode = instantiate(this.itemPrefab);
    itemNode.parent = this.node;
    itemNode.setSiblingIndex(999);
    itemNode.setPosition(slot.node.position);

    const item = itemNode.getComponent(Item);

    if (!item) {
      console.error("Item component not found on Item prefab");
      return;
    }

    item.init(itemType, this);
    slot.setItem(item);
  }

  public tryMoveItemToNearestSlot(item: Item): boolean {
    if (this.isLevelEnded) {
      item.backToCurrentSlot();
      return false;
    }

    const targetSlot = this.findNearestSlot(item.node.position);

    if (!targetSlot) {
      item.backToCurrentSlot();
      return false;
    }

    if (!targetSlot.isEmpty()) {
      item.backToCurrentSlot();
      return false;
    }

    return this.moveItem(item, targetSlot);
  }

  private findNearestSlot(position: Vec3): Slot | null {
    let nearestSlot: Slot | null = null;
    let nearestDistance = Number.MAX_VALUE;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const slot = this.slots[row][col];
        const distance = Vec3.distance(position, slot.node.position);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSlot = slot;
        }
      }
    }

    const maxDistance = this.slotSize / 2;

    if (nearestDistance > maxDistance) {
      return null;
    }

    return nearestSlot;
  }

  private moveItem(item: Item, targetSlot: Slot): boolean {
    const fromSlot = item.currentSlot;

    if (!fromSlot) {
      item.backToCurrentSlot();
      return false;
    }

    this.pushHistorySnapshot();

    fromSlot.removeItem();
    targetSlot.setItem(item);

    item.node.setPosition(targetSlot.node.position);

    this.moveCount++;

    if (this.gameUI) {
      this.gameUI.setMoveCount(this.moveCount);
    }

    this.afterMove();

    return true;
  }

  private pushHistorySnapshot() {
    const snapshot = this.createBoardSnapshot();

    this.historyStack.push(snapshot);

    if (this.historyStack.length > this.maxHistoryCount) {
      this.historyStack.shift();
    }
  }

  private createBoardSnapshot(): ItemType[][] {
    const snapshot: ItemType[][] = [];

    for (let row = 0; row < this.rows; row++) {
      snapshot[row] = [];

      for (let col = 0; col < this.cols; col++) {
        const item = this.slots[row][col].item;
        snapshot[row][col] = item ? item.type : null;
      }
    }

    return snapshot;
  }

  public undoLastMove() {
    if (this.isLevelEnded) {
      console.log("Cannot undo: level has ended");
      return;
    }

    const restored = this.restoreLastSnapshot();

    if (!restored) {
      return;
    }

    this.moveCount = Math.max(0, this.moveCount - 1);

    if (this.gameUI) {
      this.gameUI.setMoveCount(this.moveCount);
    }
  }

  private restoreLastSnapshot(): boolean {
    const snapshot = this.historyStack.pop();

    if (!snapshot) {
      console.log("No history to restore");
      return false;
    }

    this.restoreBoardFromSnapshot(snapshot);
    return true;
  }

  public reviveByAd() {
    console.log("Try revive by reward ad");

    AdManager.showRewardAd(
      () => {
        this.doRevive();
      },
      () => {
        console.log("Reward ad failed or skipped");
      },
    );
  }

  private doRevive() {
    const restored = this.restoreLastSnapshot();

    if (!restored) {
      console.log("Revive failed: no history");
      return;
    }

    this.moveCount = Math.max(0, this.moveCount - 1);
    this.isLevelEnded = false;

    if (this.gameUI) {
      this.gameUI.setMoveCount(this.moveCount);
      this.gameUI.hideResult();
    }

    console.log("Revive success");
  }

  public undoByAd() {
    console.log("Try undo by reward ad");

    AdManager.showRewardAd(
      () => {
        this.undoLastMove();
      },
      () => {
        console.log("Reward ad failed or skipped");
      },
    );
  }

  private restoreBoardFromSnapshot(snapshot: ItemType[][]) {
    this.clearAllItemsOnly();

    for (let row = 0; row < snapshot.length; row++) {
      for (let col = 0; col < snapshot[row].length; col++) {
        const itemType = snapshot[row][col];

        if (!itemType) {
          continue;
        }

        const slot = this.slots[row]?.[col];

        if (!slot) {
          continue;
        }

        this.createItemAtSlot(itemType, slot);
      }
    }
  }

  private clearAllItemsOnly() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const slot = this.slots[row][col];
        const item = slot.item;

        if (item && item.node && item.node.isValid) {
          item.node.destroy();
        }

        slot.item = null;
      }
    }
  }

  private afterMove() {
    if (this.isLevelEnded) {
      return;
    }

    const hasMatched = this.checkMatches();

    if (hasMatched) {
      this.checkWin();
      return;
    }

    this.checkFail();
  }

  private checkMatches(): boolean {
    for (let row = 0; row < this.rows; row++) {
      const typeToSlots = new Map<string, Slot[]>();

      for (let col = 0; col < this.cols; col++) {
        const slot = this.slots[row][col];
        const item = slot.item;

        if (!item) {
          continue;
        }

        if (!typeToSlots.has(item.type)) {
          typeToSlots.set(item.type, []);
        }

        typeToSlots.get(item.type)!.push(slot);
      }

      for (const [type, matchedSlots] of typeToSlots.entries()) {
        if (matchedSlots.length >= this.matchCount) {
          console.log(`Matched ${type} on row ${row}`);

          const slotsToClear = matchedSlots.slice(0, this.matchCount);
          this.clearSlots(slotsToClear);

          return true;
        }
      }
    }

    return false;
  }

  private clearSlots(slotsToClear: Slot[]) {
    for (const slot of slotsToClear) {
      const item = slot.item;

      if (!item) {
        continue;
      }

      slot.removeItem();
      item.node.destroy();
    }
  }

  private checkWin(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.slots[row][col].item) {
          return false;
        }
      }
    }

    this.isLevelEnded = true;
    console.log("Level Win");

    const starCount = this.calculateStars();

    SaveManager.saveLevelStars(this.currentLevelId, starCount);
    SaveManager.saveCurrentLevel(this.currentLevelId + 1);

    if (this.gameUI) {
      this.gameUI.showWin(this.moveCount, starCount);
    }

    return true;
  }

  private checkFail(): boolean {
    if (this.moveLimit > 0 && this.moveCount >= this.moveLimit) {
      this.isLevelEnded = true;
      console.log("Level Fail: move limit reached");

      if (this.gameUI) {
        this.gameUI.showFail();
      }

      return true;
    }

    if (this.hasEmptySlot()) {
      return false;
    }

    this.isLevelEnded = true;
    console.log("Level Fail: no empty slot");

    if (this.gameUI) {
      this.gameUI.showFail();
    }

    return true;
  }

  private hasEmptySlot(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.slots[row][col].item) {
          return true;
        }
      }
    }

    return false;
  }
}
