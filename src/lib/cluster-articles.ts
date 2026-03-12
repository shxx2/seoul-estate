import type { Article } from "@/types/article";
import type { ArticleCluster } from "@/components/map/ClusterMarker";

/**
 * 동일 매물명의 매물을 클러스터로 그룹화
 * 같은 아파트/건물의 여러 호실을 하나의 마커로 표시
 */
export function clusterArticles(articles: Article[]): ArticleCluster[] {
  const clusterMap = new Map<string, ArticleCluster>();

  for (const article of articles) {
    // 매물명 + 동 이름으로 그룹화 (같은 건물의 매물을 하나로)
    const key = `${article.articleName}-${article.dong}`;

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
