import { _decorator, Component, Node, Label, Button } from "cc";

const { ccclass, property } = _decorator;

@ccclass("GameUI")
export class GameUI extends Component {
  @property(Node)
  public resultPanel: Node | null = null;

  @property(Label)
  public titleLabel: Label | null = null;

  @property(Label)
  public levelLabel: Label | null = null;

  @property(Button)
  public restartButton: Button | null = null;

  @property(Button)
  public nextButton: Button | null = null;

  private onRestartCallback: (() => void) | null = null;
  private onNextCallback: (() => void) | null = null;

  onLoad() {
    this.hideResult();

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
  }

  onDestroy() {
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
  }

  public setRestartCallback(callback: () => void) {
    this.onRestartCallback = callback;
  }

  public setNextCallback(callback: () => void) {
    this.onNextCallback = callback;
  }

  public setLevel(levelId: number) {
    if (this.levelLabel) {
      this.levelLabel.string = `第 ${levelId} 关`;
    }
  }

  public showWin() {
    this.showResult("通关成功", true);
  }

  public showFail() {
    this.showResult("挑战失败", false);
  }

  public hideResult() {
    if (this.resultPanel) {
      this.resultPanel.active = false;
    }
  }

  private showResult(title: string, showNext: boolean) {
    if (this.titleLabel) {
      this.titleLabel.string = title;
    }

    if (this.nextButton) {
      this.nextButton.node.active = showNext;
    }

    if (this.resultPanel) {
      this.resultPanel.active = true;
      this.resultPanel.setSiblingIndex(999);
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
}
