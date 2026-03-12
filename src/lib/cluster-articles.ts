import type { Article } from "@/types/article";
import type { ArticleCluster } from "@/components/map/ClusterMarker";

/**
 * 동일 위치의 매물을 클러스터로 그룹화
 * 위치 비교 시 소수점 5자리까지만 비교 (약 1m 오차 허용)
 */
export function clusterArticles(articles: Article[]): ArticleCluster[] {
  const clusterMap = new Map<string, ArticleCluster>();

  for (const article of articles) {
    // 소수점 5자리로 반올림하여 키 생성 (약 1m 정밀도)
    const latKey = article.lat.toFixed(5);
    const lngKey = article.lng.toFixed(5);
    const key = `${latKey},${lngKey}`;

    const price = article.dealPrice ?? article.deposit ?? 0;

    if (clusterMap.has(key)) {
      const cluster = clusterMap.get(key)!;
      cluster.articles.push(article);
      cluster.minPrice = Math.min(cluster.minPrice, price);
      cluster.maxPrice = Math.max(cluster.maxPrice, price);
    } else {
      clusterMap.set(key, {
        key,
        lat: article.lat,
        lng: article.lng,
        articles: [article],
        minPrice: price,
        maxPrice: price,
      });
    }
  }

  return Array.from(clusterMap.values());
}
