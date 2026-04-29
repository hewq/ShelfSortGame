import { _decorator, Component } from "cc";
import { Item } from "./Item";

const { ccclass } = _decorator;

@ccclass("Slot")
export class Slot extends Component {
  public row: number = 0;
  public col: number = 0;
  public item: Item | null = null;

  public init(row: number, col: number) {
    this.row = row;
    this.col = col;
    this.item = null;
  }

  public isEmpty(): boolean {
    return this.item === null;
  }

  public setItem(item: Item) {
    this.item = item;
    item.currentSlot = this;
  }

  public removeItem(): Item | null {
    const oldItem = this.item;
    this.item = null;

    if (oldItem) {
      oldItem.currentSlot = null;
    }

    return oldItem;
  }
}
