import { BUILDING_TYPE_TO_NAVER, SEOUL_DISTRICT_CODES, TRADE_TYPE_TO_NAVER } from "../src/lib/constants";
import { cortarNoToBounds } from "../src/lib/region-lookup";
import { mergeNaverFetchDiagnostics } from "../src/lib/naver/diagnostics";
import { fetchArticleList } from "../src/lib/naver/client";
import { normalizeArticleResults } from "../src/lib/naver/normalize-articles";
import { createArticleFetchPlan } from "../src/lib/naver/query-planner";
import { transformNaverArticle } from "../src/lib/naver/transform";
import type { BuildingType, TradeType } from "../src/types/article";

type CliArgs = Record<string, string>;

function parseArgs(argv: string[]): CliArgs {
  const parsed: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith("--")) {
      continue;
    }

    const withoutPrefix = arg.slice(2);
    const [key, inlineValue] = withoutPrefix.split("=", 2);
    if (!key) {
      continue;
    }

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
      continue;
    }

    parsed[key] = "true";
  }

  return parsed;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function parseTradeType(value: string | undefined): TradeType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toUpperCase();
  switch (normalized) {
    case "SALE":
    case "A1":
      return "SALE";
    case "JEONSE":
    case "B1":
      return "JEONSE";
    case "MONTHLY":
    case "B2":
      return "MONTHLY";
    default:
      throw new Error(`Unsupported tradeType: ${value}`);
  }
}

function parseBuildingType(value: string | undefined): BuildingType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toUpperCase();
  switch (normalized) {
    case "APT":
      return "APT";
    case "VILLA":
    case "VL":
      return "VILLA";
    case "OFFICETEL":
    case "OPST":
      return "OFFICETEL";
    default:
      throw new Error(`Unsupported buildingType: ${value}`);
  }
}

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  pnpm debug:naver-articles --guCode=1120000000 --tradeType=JEONSE --buildingType=APT --depositMax=70000",
      "",
      "Options:",
      "  --guCode / --dongCode / --cortarNo",
      "  --tradeType=SALE|JEONSE|MONTHLY|A1|B1|B2",
      "  --buildingType=APT|VILLA|OFFICETEL|VL|OPST",
      "  --dealPriceMin --dealPriceMax",
      "  --depositMin --depositMax",
      "  --monthlyRentMin --monthlyRentMax",
      "  --areaMin --areaMax",
      "  --pages=<number>   Optional override for max crawl depth",
    ].join("\n")
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true") {
    printUsage();
    return;
  }

  const cortarNo = args.dongCode || args.guCode || args.cortarNo;
  if (!cortarNo) {
    printUsage();
    throw new Error("One of --guCode, --dongCode, or --cortarNo is required");
  }

  const tradeType = parseTradeType(args.tradeType);
  const buildingType = parseBuildingType(args.buildingType);
  const bounds = cortarNoToBounds(cortarNo);

  if (!bounds) {
    throw new Error(`Unknown cortarNo: ${cortarNo}`);
  }

  const tradeTypes = tradeType ? TRADE_TYPE_TO_NAVER[tradeType] : "A1:B1:B2";
  const buildingTypes = buildingType ? BUILDING_TYPE_TO_NAVER[buildingType] : "APT:VL:OPST";

  const plan = createArticleFetchPlan({
    tradeTypes,
    buildingTypes,
    dealPriceMin: parseNumber(args.dealPriceMin),
    dealPriceMax: parseNumber(args.dealPriceMax),
    depositMin: parseNumber(args.depositMin),
    depositMax: parseNumber(args.depositMax),
    monthlyRentMin: parseNumber(args.monthlyRentMin),
    monthlyRentMax: parseNumber(args.monthlyRentMax),
    areaMin: parseNumber(args.areaMin),
    areaMax: parseNumber(args.areaMax),
  });
  const maxPages = parseNumber(args.pages) ?? plan.maxPages;
  const requestedGuName =
    SEOUL_DISTRICT_CODES[args.guCode ?? ""] ?? SEOUL_DISTRICT_CODES[cortarNo];

  console.log("[debug:naver-articles] query");
  console.log(
    JSON.stringify(
      {
        cortarNo,
        requestedGuName,
        tradeTypes,
        buildingTypes,
        dealPriceMin: parseNumber(args.dealPriceMin),
        dealPriceMax: parseNumber(args.dealPriceMax),
        depositMin: parseNumber(args.depositMin),
        depositMax: parseNumber(args.depositMax),
        monthlyRentMin: parseNumber(args.monthlyRentMin),
        monthlyRentMax: parseNumber(args.monthlyRentMax),
        areaMin: parseNumber(args.areaMin),
        areaMax: parseNumber(args.areaMax),
        fetchPlan: plan,
        maxPages,
      },
      null,
      2
    )
  );

  const diagnostics = [];
  const transformedArticles = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchArticleList(
      {
        rletTpCd: buildingTypes,
        tradTpCd: tradeTypes,
        z: bounds.z,
        lat: bounds.lat,
        lon: bounds.lon,
        btm: bounds.btm,
        lft: bounds.lft,
        top: bounds.top,
        rgt: bounds.rgt,
        page,
        spcMin: parseNumber(args.areaMin),
        spcMax: parseNumber(args.areaMax),
        prcMin: parseNumber(args.dealPriceMin),
        prcMax: parseNumber(args.dealPriceMax),
        dprcMin: parseNumber(args.depositMin),
        dprcMax: parseNumber(args.depositMax),
        wprcMin: parseNumber(args.monthlyRentMin),
        wprcMax: parseNumber(args.monthlyRentMax),
      },
      {
        forceRefresh: true,
      }
    );

    diagnostics.push(result.diagnostics);

    const pageArticles = (result.response.body ?? []).map(transformNaverArticle);
    transformedArticles.push(...pageArticles);

    const pageNormalized = normalizeArticleResults(pageArticles, {
      bounds,
      requestedGuName,
      dealPriceMin: parseNumber(args.dealPriceMin),
      dealPriceMax: parseNumber(args.dealPriceMax),
      depositMin: parseNumber(args.depositMin),
      depositMax: parseNumber(args.depositMax),
      monthlyRentMin: parseNumber(args.monthlyRentMin),
      monthlyRentMax: parseNumber(args.monthlyRentMax),
      areaMin: parseNumber(args.areaMin),
      areaMax: parseNumber(args.areaMax),
    });

    const cumulativeNormalized = normalizeArticleResults(transformedArticles, {
      bounds,
      requestedGuName,
      dealPriceMin: parseNumber(args.dealPriceMin),
      dealPriceMax: parseNumber(args.dealPriceMax),
      depositMin: parseNumber(args.depositMin),
      depositMax: parseNumber(args.depositMax),
      monthlyRentMin: parseNumber(args.monthlyRentMin),
      monthlyRentMax: parseNumber(args.monthlyRentMax),
      areaMin: parseNumber(args.areaMin),
      areaMax: parseNumber(args.areaMax),
    });

    console.log(
      JSON.stringify({
        page,
        upstreamCount: result.response.body?.length ?? 0,
        statusCodes: result.diagnostics.upstreamStatusCodes,
        retries: result.diagnostics.retryCount,
        pageFilteredCount: pageNormalized.articles.length,
        cumulativeFilteredCount: cumulativeNormalized.articles.length,
        hasMore: result.response.isMoreData ?? result.response.more ?? false,
      })
    );

    if (!result.response.isMoreData && !result.response.more) {
      break;
    }
  }

  const mergedDiagnostics = mergeNaverFetchDiagnostics(diagnostics);
  const normalized = normalizeArticleResults(transformedArticles, {
    bounds,
    requestedGuName,
    dealPriceMin: parseNumber(args.dealPriceMin),
    dealPriceMax: parseNumber(args.dealPriceMax),
    depositMin: parseNumber(args.depositMin),
    depositMax: parseNumber(args.depositMax),
    monthlyRentMin: parseNumber(args.monthlyRentMin),
    monthlyRentMax: parseNumber(args.monthlyRentMax),
    areaMin: parseNumber(args.areaMin),
    areaMax: parseNumber(args.areaMax),
  });

  console.log("[debug:naver-articles] summary");
  console.log(
    JSON.stringify(
      {
        diagnostics: mergedDiagnostics,
        normalization: normalized.stats,
        finalFilteredCount: normalized.articles.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[debug:naver-articles] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
