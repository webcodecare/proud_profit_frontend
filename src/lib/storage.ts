// Universal storage utility that handles localStorage blocking in iframes
export class UniversalStorage {
  private static storageType: "localStorage" | "sessionStorage" | "memory" =
    "localStorage";
  private static memoryStore: Map<string, string> = new Map();
  private static initialized = false;

  // Detect which storage is available
  private static detectStorage(): void {
    if (this.initialized) return;

    try {
      // Try localStorage first
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      this.storageType = "localStorage";
      console.log("✅ localStorage is available");
    } catch (e) {
      console.warn(
        "⚠️ localStorage blocked or unavailable, trying sessionStorage"
      );

      try {
        // Try sessionStorage as fallback
        const testKey = "__storage_test__";
        sessionStorage.setItem(testKey, "test");
        sessionStorage.removeItem(testKey);
        this.storageType = "sessionStorage";
        console.log("✅ Using sessionStorage as fallback");
      } catch (e2) {
        // Fall back to in-memory storage
        this.storageType = "memory";
        console.warn(
          "⚠️ Both localStorage and sessionStorage blocked, using in-memory storage"
        );
        console.warn("⚠️ Sessions will not persist across page reloads");
      }
    }

    this.initialized = true;
  }

  // Set item in available storage
  static setItem(key: string, value: string): void {
    this.detectStorage();

    try {
      if (this.storageType === "localStorage") {
        localStorage.setItem(key, value);
      } else if (this.storageType === "sessionStorage") {
        sessionStorage.setItem(key, value);
      } else {
        this.memoryStore.set(key, value);
      }
    } catch (error) {
      console.error("Storage setItem failed:", error);
      // Fall back to memory storage
      this.memoryStore.set(key, value);
    }
  }

  // Get item from available storage
  static getItem(key: string): string | null {
    this.detectStorage();

    try {
      if (this.storageType === "localStorage") {
        return localStorage.getItem(key);
      } else if (this.storageType === "sessionStorage") {
        return sessionStorage.getItem(key);
      } else {
        return this.memoryStore.get(key) || null;
      }
    } catch (error) {
      console.error("Storage getItem failed:", error);
      return this.memoryStore.get(key) || null;
    }
  }

  // Remove item from available storage
  static removeItem(key: string): void {
    this.detectStorage();

    try {
      if (this.storageType === "localStorage") {
        localStorage.removeItem(key);
      } else if (this.storageType === "sessionStorage") {
        sessionStorage.removeItem(key);
      } else {
        this.memoryStore.delete(key);
      }
    } catch (error) {
      console.error("Storage removeItem failed:", error);
      this.memoryStore.delete(key);
    }
  }

  // Clear all storage
  static clear(): void {
    this.detectStorage();

    try {
      if (this.storageType === "localStorage") {
        localStorage.clear();
      } else if (this.storageType === "sessionStorage") {
        sessionStorage.clear();
      } else {
        this.memoryStore.clear();
      }
    } catch (error) {
      console.error("Storage clear failed:", error);
      this.memoryStore.clear();
    }
  }

  // Get current storage type
  static getStorageType(): string {
    this.detectStorage();
    return this.storageType;
  }

  // Check if storage is persistent (not memory-only)
  static isPersistent(): boolean {
    this.detectStorage();
    return this.storageType !== "memory";
  }
}
