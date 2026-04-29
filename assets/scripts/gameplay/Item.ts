import {
  _decorator,
  Component,
  Label,
  Sprite,
  Color,
  Node,
  EventTouch,
  Vec3,
} from "cc";
import { Slot } from "./Slot";
import { Shelf } from "./Shelf";

const { ccclass, property } = _decorator;

@ccclass("Item")
export class Item extends Component {
  public type: string = "";
  public currentSlot: Slot | null = null;

  @property(Label)
  public typeLabel: Label | null = null;

  @property(Sprite)
  public iconSprite: Sprite | null = null;

  private shelf: Shelf | null = null;
  private originalPosition: Vec3 = new Vec3();
  private isDragging: boolean = false;

  public init(type: string, shelf: Shelf) {
    this.type = type;
    this.shelf = shelf;
    this.updateView();
  }

  onEnable() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDisable() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private onTouchStart(event: EventTouch) {
    this.isDragging = true;
    this.originalPosition.set(this.node.position);
    this.node.setSiblingIndex(999);
  }

  private onTouchMove(event: EventTouch) {
    if (!this.isDragging) {
      return;
    }

    const delta = event.getUIDelta();
    const currentPos = this.node.position;

    this.node.setPosition(
      currentPos.x + delta.x,
      currentPos.y + delta.y,
      currentPos.z,
    );
  }

  private onTouchEnd(event: EventTouch) {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    if (!this.shelf) {
      this.backToCurrentSlot();
      return;
    }

    this.shelf.tryMoveItemToNearestSlot(this);
  }

  public backToCurrentSlot() {
    if (this.currentSlot) {
      this.node.setPosition(this.currentSlot.node.position);
    } else {
      this.node.setPosition(this.originalPosition);
    }
  }

  private updateView() {
    if (this.typeLabel) {
      this.typeLabel.string = this.getDisplayText(this.type);
    }

    if (this.iconSprite) {
      this.iconSprite.color = this.getColor(this.type);
    }
  }

  private getDisplayText(type: string): string {
    const map: Record<string, string> = {
      apple: "A",
      banana: "B",
      cola: "C",
      cookie: "K",
      toy: "T",
    };

    return map[type] ?? "?";
  }

  private getColor(type: string): Color {
    const map: Record<string, Color> = {
      apple: new Color(230, 80, 80, 255),
      banana: new Color(240, 210, 80, 255),
      cola: new Color(80, 150, 240, 255),
      cookie: new Color(170, 110, 60, 255),
      toy: new Color(180, 100, 230, 255),
    };

    return map[type] ?? new Color(180, 180, 180, 255);
  }
}
