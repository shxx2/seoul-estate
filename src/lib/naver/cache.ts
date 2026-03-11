import type { ArticleListParams } from "./client";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * 네이버 API 응답을 캐싱하는 인메모리 캐시
 *
 * 특징:
 * - Map 기반 단순 구조
 * - TTL 만료 시 자동 삭제
 * - LRU 방식 크기 제한 (serverless 메모리 보호)
 * - 요청 파라미터 기반 해시 키 생성
 */
class NaverCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private ttl: number;
  private maxSize: number;

  /**
   * @param ttlSeconds 캐시 TTL (초 단위)
   * @param maxSize 최대 캐시 엔트리 개수 (기본 100)
   */
  constructor(ttlSeconds: number, maxSize = 100) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // 밀리초로 변환
    this.maxSize = maxSize;
  }

  /**
   * 요청 파라미터를 기반으로 캐시 키 생성
   *
   * @param params 요청 파라미터 객체
   * @returns 캐시 키 문자열
   */
  generateKey(params: ArticleListParams): string {
    // 파라미터를 정렬된 JSON 문자열로 변환하여 일관된 키 생성
    const sortedParams: Record<string, unknown> = {};
    const keys = Object.keys(params).sort();

    for (const key of keys) {
      const value = params[key as keyof ArticleListParams];
      if (value !== undefined) {
        sortedParams[key] = value;
      }
    }

    return JSON.stringify(sortedParams);
  }

  /**
   * 캐시에서 데이터 조회
   *
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 null (만료/없음)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // TTL 만료 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 만료된 캐시 엔트리 삭제 (내부 정리)
   */
  private cleanExpired(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시에 데이터 저장
   *
   * @param key 캐시 키
   * @param data 저장할 데이터
   */
  set<T>(key: string, data: T): void {
    // 만료된 엔트리 먼저 정리
    this.cleanExpired();

    // LRU eviction: Map은 삽입 순서를 유지하므로 첫 번째 키가 가장 오래된 항목
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + this.ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 현재 캐시 크기 반환 (디버깅용)
   */
  size(): number {
    return this.cache.size;
  }
}

// 5분 TTL 싱글톤 인스턴스
export const naverCache = new NaverCache(300);
