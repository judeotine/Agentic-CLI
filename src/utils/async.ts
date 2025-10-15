export class AsyncUtils {
  static async retry<T>(
    fn: () => Promise<T>,
    attempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.sleep(delay * (i + 1));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  static async parallel<T>(tasks: Array<() => Promise<T>>, limit: number = 5): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = task().then((result) => {
        results.push(result);
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  static async sequential<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    for (const task of tasks) {
      results.push(await task());
    }
    return results;
  }

  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        fn(...args);
      }
    };
  }
}

