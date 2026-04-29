import { resources, JsonAsset } from "cc";
import { LevelConfig } from "../data/LevelTypes";

export class LevelManager {
  public static loadLevel(levelId: number): Promise<LevelConfig> {
    const levelPath = `levels/level_${levelId.toString().padStart(3, "0")}`;

    return new Promise((resolve, reject) => {
      resources.load(levelPath, JsonAsset, (err, asset) => {
        if (err) {
          console.error(`Load level failed: ${levelPath}`, err);
          reject(err);
          return;
        }

        if (!asset) {
          reject(new Error(`Level asset is null: ${levelPath}`));
          return;
        }

        const config = asset.json as LevelConfig;
        resolve(config);
      });
    });
  }
}
