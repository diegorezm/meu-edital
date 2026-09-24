import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSeed } from "@/domain/seed";
import { AppData } from "@/domain/types";

const KEY = "@meu-edital:data:v1";
export interface Repository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}
export const localRepository: Repository = {
  async load() {
    const stored = await AsyncStorage.getItem(KEY);
    if (!stored) {
      const seed = createSeed();
      await this.save(seed);
      return seed;
    }
    const parsed: AppData = JSON.parse(stored);
    if (parsed.version !== 1)
      throw new Error("Versão dos dados locais incompatível.");
    return parsed;
  },
  async save(data) {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  },
};
