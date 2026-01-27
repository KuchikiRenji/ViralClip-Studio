type AnyFunction = (...args: unknown[]) => unknown;

export function debounce<T extends AnyFunction>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
}

export function throttle<T extends AnyFunction>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function memoize<T extends AnyFunction>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  const MAX_CACHE_SIZE = 100;

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);

    if (cache.size > MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function supportsWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);

  try {
    const result = await Promise.resolve(fn());
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return result;
  } catch (error) {
    performance.mark(endMark);
    throw error;
  }
}

export function requestIdleCallbackPolyfill(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  return window.setTimeout(callback, options?.timeout || 1);
}

export function cancelIdleCallbackPolyfill(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  batchSize: number = 10,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, batchSize);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkResults = await Promise.all(
      chunk.map((item, idx) => processor(item, i * batchSize + idx))
    );
    results.push(...chunkResults);

    if (onProgress) {
      onProgress(results.length, items.length);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
}

const DEFAULT_CLEANUP_DELAY = 60000;

export function createManagedObjectURL(
  blob: Blob,
  cleanupDelay: number = DEFAULT_CLEANUP_DELAY
): string {
  const url = URL.createObjectURL(blob);
  setTimeout(() => URL.revokeObjectURL(url), cleanupDelay);
  return url;
}

export function estimateMemoryUsage(obj: unknown): number {
  const seen = new WeakSet();

  function sizeOf(object: unknown): number {
    if (object === null || object === undefined) return 0;

    let bytes = 0;
    const type = typeof object;

    if (type === 'boolean') bytes = 4;
    else if (type === 'string') bytes = (object as string).length * 2;
    else if (type === 'number') bytes = 8;
    else if (type === 'object') {
      const obj = object as Record<string, unknown>;
      if (seen.has(obj)) return 0;
      seen.add(obj);

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          bytes += sizeOf(key);
          bytes += sizeOf(obj[key]);
        }
      }
    }

    return bytes;
  }

  return sizeOf(obj);
}

export async function clearCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const MEMORY_CHECK_INTERVAL = 5000;

export function monitorMemory(
  threshold: number = 80,
  onWarning?: (usage: number) => void
): () => void {
  const perf = performance as Performance & { memory?: PerformanceMemory };
  if (!perf.memory) {
    return () => {};
  }

  const interval = setInterval(() => {
    const memory = perf.memory;
    if (memory) {
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      if (usagePercent > threshold && onWarning) {
        onWarning(usagePercent);
      }
    }
  }, MEMORY_CHECK_INTERVAL);

  return () => clearInterval(interval);
}

export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
