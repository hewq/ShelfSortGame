import {
  _decorator,
  Component,
  Node,
  Label,
  Button,
  Prefab,
  instantiate,
  Vec3,
} from "cc";

const { ccclass, property } = _decorator;

@ccclass("GameUI")
export class GameUI extends Component {
  @property(Node)
  public homePanel: Node | null = null;

  @property(Button)
  public startButton: Button | null = null;

  @property(Button)
  public levelSelectButton: Button | null = null;

  @property(Node)
  public levelSelectPanel: Node | null = null;

  @property(Button)
  public backHomeButton: Button | null = null;

  @property(Node)
  public levelButtonContainer: Node | null = null;

  @property(Prefab)
  public levelButtonPrefab: Prefab | null = null;

  @property(Node)
  public resultPanel: Node | null = null;

  @property(Label)
  public titleLabel: Label | null = null;

  @property(Label)
  public levelLabel: Label | null = null;

  @property(Label)
  public moveLabel: Label | null = null;

  @property(Button)
  public restartButton: Button | null = null;

  @property(Button)
  public nextButton: Button | null = null;

  @property(Button)
  public undoButton: Button | null = null;

  @property(Button)
  public reviveButton: Button | null = null;

  @property(Button)
  public resetSaveButton: Button | null = null;

  private onStartCallback: (() => void) | null = null;
  private onOpenLevelSelectCallback: (() => void) | null = null;
  private onSelectLevelCallback: ((levelId: number) => void) | null = null;

  private onRestartCallback: (() => void) | null = null;
  private onNextCallback: (() => void) | null = null;
  private onUndoCallback: (() => void) | null = null;
  private onReviveCallback: (() => void) | null = null;
  private onResetSaveCallback: (() => void) | null = null;

  onLoad() {
    this.showHome();
    this.hideResult();

    if (this.startButton) {
      this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
    }

    if (this.levelSelectButton) {
      this.levelSelectButton.node.on(
        Button.EventType.CLICK,
        this.onLevelSelectClick,
        this,
      );
    }

    if (this.backHomeButton) {
      this.backHomeButton.node.on(Button.EventType.CLICK, this.showHome, this);
    }

    if (this.restartButton) {
      this.restartButton.node.on(
        Button.EventType.CLICK,
        this.onRestartClick,
        this,
      );
    }

    if (this.nextButton) {
      this.nextButton.node.on(Button.EventType.CLICK, this.onNextClick, this);
    }

    if (this.undoButton) {
      this.undoButton.node.on(Button.EventType.CLICK, this.onUndoClick, this);
    }

    if (this.reviveButton) {
      this.reviveButton.node.on(
        Button.EventType.CLICK,
        this.onReviveClick,
        this,
      );
    }

    if (this.resetSaveButton) {
      this.resetSaveButton.node.on(
        Button.EventType.CLICK,
        this.onResetSaveClick,
        this,
      );
    }
  }

  onDestroy() {
    if (this.startButton) {
      this.startButton.node.off(
        Button.EventType.CLICK,
        this.onStartClick,
        this,
      );
    }

    if (this.levelSelectButton) {
      this.levelSelectButton.node.off(
        Button.EventType.CLICK,
        this.onLevelSelectClick,
        this,
      );
    }

    if (this.backHomeButton) {
      this.backHomeButton.node.off(Button.EventType.CLICK, this.showHome, this);
    }

    if (this.restartButton) {
      this.restartButton.node.off(
        Button.EventType.CLICK,
        this.onRestartClick,
        this,
      );
    }

    if (this.nextButton) {
      this.nextButton.node.off(Button.EventType.CLICK, this.onNextClick, this);
    }

    if (this.undoButton) {
      this.undoButton.node.off(Button.EventType.CLICK, this.onUndoClick, this);
    }

    if (this.reviveButton) {
      this.reviveButton.node.off(
        Button.EventType.CLICK,
        this.onReviveClick,
        this,
      );
    }

    if (this.resetSaveButton) {
      this.resetSaveButton.node.off(
        Button.EventType.CLICK,
        this.onResetSaveClick,
        this,
      );
    }
  }

  public setStartCallback(callback: () => void) {
    this.onStartCallback = callback;
  }

  public setOpenLevelSelectCallback(callback: () => void) {
    this.onOpenLevelSelectCallback = callback;
  }

  public setSelectLevelCallback(callback: (levelId: number) => void) {
    this.onSelectLevelCallback = callback;
  }

  public setRestartCallback(callback: () => void) {
    this.onRestartCallback = callback;
  }

  public setNextCallback(callback: () => void) {
    this.onNextCallback = callback;
  }

  public setUndoCallback(callback: () => void) {
    this.onUndoCallback = callback;
  }

  public setReviveCallback(callback: () => void) {
    this.onReviveCallback = callback;
  }

  public setResetSaveCallback(callback: () => void) {
    this.onResetSaveCallback = callback;
  }

  public showHome() {
    if (this.homePanel) {
      this.homePanel.active = true;
    }

    if (this.levelSelectPanel) {
      this.levelSelectPanel.active = false;
    }

    this.setGameUIVisible(false);
    this.hideResult();
  }

  public showGame() {
    if (this.homePanel) {
      this.homePanel.active = false;
    }

    if (this.levelSelectPanel) {
      this.levelSelectPanel.active = false;
    }

    this.setGameUIVisible(true);
    this.hideResult();
  }

  public showLevelSelect() {
    if (this.homePanel) {
      this.homePanel.active = false;
    }

    if (this.levelSelectPanel) {
      this.levelSelectPanel.active = true;
    }

    this.setGameUIVisible(false);
    this.hideResult();
  }

  private setGameUIVisible(visible: boolean) {
    if (this.levelLabel) {
      this.levelLabel.node.active = visible;
    }

    if (this.moveLabel) {
      this.moveLabel.node.active = visible;
    }

    if (this.undoButton) {
      this.undoButton.node.active = visible;
    }

    if (this.resetSaveButton) {
      this.resetSaveButton.node.active = visible;
    }
  }

  public buildLevelButtons(
    levelCount: number,
    getStars: (levelId: number) => number,
  ) {
    if (!this.levelButtonContainer || !this.levelButtonPrefab) {
      return;
    }

    this.levelButtonContainer.removeAllChildren();

    const cols = 3;
    const gapX = 190;
    const gapY = 150;
    const startX = -gapX;
    const startY = 120;

    for (let i = 1; i <= levelCount; i++) {
      const buttonNode = instantiate(this.levelButtonPrefab);
      buttonNode.parent = this.levelButtonContainer;

      const row = Math.floor((i - 1) / cols);
      const col = (i - 1) % cols;

      buttonNode.setPosition(
        new Vec3(startX + col * gapX, startY - row * gapY, 0),
      );

      const label = buttonNode.getComponentInChildren(Label);
      if (label) {
        const stars = this.getStarText(getStars(i));
        label.string = `第 ${i} 关\n${stars}`;
      }

      const button = buttonNode.getComponent(Button);
      if (button) {
        const levelId = i;
        button.node.on(Button.EventType.CLICK, () => {
          if (this.onSelectLevelCallback) {
            this.onSelectLevelCallback(levelId);
          }
        });
      }
    }
  }

  public setLevel(levelId: number, bestStars: number = 0) {
    if (!this.levelLabel) {
      return;
    }

    if (bestStars > 0) {
      const stars = this.getStarText(bestStars);
      this.levelLabel.string = `第 ${levelId} 关  历史最佳：${stars}`;
    } else {
      this.levelLabel.string = `第 ${levelId} 关`;
    }
  }

  public setMoveCount(moveCount: number) {
    if (this.moveLabel) {
      this.moveLabel.string = `步数：${moveCount}`;
    }
  }

  public showWin(moveCount: number, starCount: number) {
    const stars = this.getStarText(starCount);
    this.showResult(
      `通关成功\n本关用了 ${moveCount} 步\n${stars}`,
      true,
      false,
    );
  }

  public showFail() {
    this.showResult("挑战失败", false, true);
  }

  public hideResult() {
    if (this.resultPanel) {
      this.resultPanel.active = false;
    }
  }

  private showResult(title: string, showNext: boolean, showRevive: boolean) {
    if (this.titleLabel) {
      this.titleLabel.string = title;
    }

    if (this.nextButton) {
      this.nextButton.node.active = showNext;
    }

    if (this.reviveButton) {
      this.reviveButton.node.active = showRevive;
    }

    if (this.resultPanel) {
      this.resultPanel.active = true;
      this.resultPanel.setSiblingIndex(999);
    }
  }

  private getStarText(starCount: number): string {
    if (starCount >= 3) {
      return "★★★";
    }

    if (starCount === 2) {
      return "★★☆";
    }

    if (starCount === 1) {
      return "★☆☆";
    }

    return "☆☆☆";
  }

  private onStartClick() {
    if (this.onStartCallback) {
      this.onStartCallback();
    }
  }

  private onLevelSelectClick() {
    if (this.onOpenLevelSelectCallback) {
      this.onOpenLevelSelectCallback();
    }
  }

  private onRestartClick() {
    this.hideResult();

    if (this.onRestartCallback) {
      this.onRestartCallback();
    }
  }

  private onNextClick() {
    this.hideResult();

    if (this.onNextCallback) {
      this.onNextCallback();
    }
  }

  private onUndoClick() {
    if (this.onUndoCallback) {
      this.onUndoCallback();
    }
  }

  private onReviveClick() {
    if (this.onReviveCallback) {
      this.onReviveCallback();
    }
  }

  private onResetSaveClick() {
    if (this.onResetSaveCallback) {
      this.onResetSaveCallback();
    }
  }
}
