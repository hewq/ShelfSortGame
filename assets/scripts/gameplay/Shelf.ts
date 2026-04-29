import { _decorator, Component, Prefab, instantiate, Vec3 } from "cc";
import { Slot } from "./Slot";
import { Item } from "./Item";
import { LevelConfig, ItemType } from "../data/LevelTypes";
import { GameUI } from "../ui/GameUI";
import { LevelManager } from "../core/LevelManager";

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

  start() {
    if (this.gameUI) {
      this.gameUI.setRestartCallback(() => {
        this.restartLevel();
      });

      this.gameUI.setNextCallback(() => {
        this.nextLevel();
      });
    }

    this.loadLevelById(this.currentLevelId).catch((error) => {
      console.error(`Load first level failed`, error);
    });
  }

  private async loadLevelById(levelId: number) {
    const config = await LevelManager.loadLevel(levelId);
    this.currentLevelId = levelId;
    this.loadLevel(config);
  }

  public loadLevel(config: LevelConfig) {
    this.currentLevelConfig = config;
    this.isLevelEnded = false;

    this.rows = config.rows;
    this.cols = config.cols;
    this.matchCount = config.matchCount;

    if (this.gameUI) {
      this.gameUI.setLevel(config.id);
      this.gameUI.hideResult();
    }

    this.createSlots();
    this.createItems(config.items);
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
    } catch (error) {
      console.warn(`Level ${nextLevelId} not found, back to level 1`);
      await this.loadLevelById(1);
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
    if (!this.itemPrefab) {
      console.error("Item prefab is not assigned");
      return;
    }

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

        const itemNode = instantiate(this.itemPrefab);
        itemNode.parent = this.node;
        itemNode.setSiblingIndex(999);
        itemNode.setPosition(slot.node.position);

        const item = itemNode.getComponent(Item);
        if (!item) {
          console.error("Item component not found on Item prefab");
          continue;
        }

        item.init(itemType, this);
        slot.setItem(item);
      }
    }
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

    fromSlot.removeItem();
    targetSlot.setItem(item);

    item.node.setPosition(targetSlot.node.position);

    this.afterMove();

    return true;
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

    if (this.gameUI) {
      this.gameUI.showWin();
    }

    return true;
  }

  private checkFail(): boolean {
    if (this.hasEmptySlot()) {
      return false;
    }

    this.isLevelEnded = true;
    console.log("Level Fail");

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
