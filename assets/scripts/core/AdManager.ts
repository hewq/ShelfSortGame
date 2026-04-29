export class AdManager {
  private static isShowingRewardAd: boolean = false;

  public static showRewardAd(onSuccess: () => void, onFail?: () => void) {
    if (this.isShowingRewardAd) {
      console.log("Reward ad is already showing");
      return;
    }

    this.isShowingRewardAd = true;

    console.log("Show fake reward ad");

    setTimeout(() => {
      this.isShowingRewardAd = false;

      console.log("Fake reward ad finished");
      onSuccess();
    }, 500);
  }

  public static showInterstitialAd() {
    console.log("Show fake interstitial ad");
  }
}
