import { sys } from "cc";

export class SaveManager {
  private static readonly CURRENT_LEVEL_KEY = "shelf_sort_current_level";
  private static readonly LEVEL_STARS_KEY = "shelf_sort_level_stars";

  public static getCurrentLevel(): number {
    const value = sys.localStorage.getItem(this.CURRENT_LEVEL_KEY);

    if (!value) {
      return 1;
    }

    const level = Number(value);

    if (Number.isNaN(level) || level <= 0) {
      return 1;
    }

    return level;
  }

  public static saveCurrentLevel(levelId: number) {
    sys.localStorage.setItem(this.CURRENT_LEVEL_KEY, String(levelId));
    console.log("Save current level:", levelId);
  }

  public static getLevelStars(levelId: number): number {
    const allStars = this.getAllLevelStars();
    return allStars[levelId] ?? 0;
  }

  public static saveLevelStars(levelId: number, stars: number) {
    const oldStars = this.getLevelStars(levelId);

    if (stars <= oldStars) {
      console.log(
        `Skip save stars: level ${levelId}, old ${oldStars}, new ${stars}`,
      );
      return;
    }

    const allStars = this.getAllLevelStars();
    allStars[levelId] = stars;

    sys.localStorage.setItem(this.LEVEL_STARS_KEY, JSON.stringify(allStars));

    console.log(`Save stars: level ${levelId}, stars ${stars}`);
  }

  public static getAllLevelStars(): Record<number, number> {
    const value = sys.localStorage.getItem(this.LEVEL_STARS_KEY);

    if (!value) {
      return {};
    }

    try {
      const parsed = JSON.parse(value);
      return parsed ?? {};
    } catch (error) {
      console.warn("Parse level stars failed", error);
      return {};
    }
  }

  public static clearSave() {
    sys.localStorage.removeItem(this.CURRENT_LEVEL_KEY);
    sys.localStorage.removeItem(this.LEVEL_STARS_KEY);
    console.log("Clear save");
  }
}
