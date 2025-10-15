import { AsyncUtils } from '../../src/utils/async';

describe('AsyncUtils', () => {
  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await AsyncUtils.retry(fn, 3, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const result = await AsyncUtils.retry(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(AsyncUtils.retry(fn, 3, 10)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('timeout', () => {
    it('should resolve if promise completes in time', async () => {
      const promise = Promise.resolve('success');

      const result = await AsyncUtils.timeout(promise, 1000);

      expect(result).toBe('success');
    });

    it('should reject if promise times out', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 1000));

      await expect(AsyncUtils.timeout(promise, 100)).rejects.toThrow('timed out');
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await AsyncUtils.sleep(100);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90);
    });
  });

  describe('parallel', () => {
    it('should execute tasks in parallel with limit', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
      ];

      const results = await AsyncUtils.parallel(tasks, 2);

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('sequential', () => {
    it('should execute tasks sequentially', async () => {
      const order: number[] = [];
      const tasks = [
        async () => {
          order.push(1);
          return 1;
        },
        async () => {
          order.push(2);
          return 2;
        },
        async () => {
          order.push(3);
          return 3;
        },
      ];

      const results = await AsyncUtils.sequential(tasks);

      expect(results).toEqual([1, 2, 3]);
      expect(order).toEqual([1, 2, 3]);
    });
  });
});

