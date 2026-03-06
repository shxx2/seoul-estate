# Open Questions

## plan-estate-mvp - 2026-03-05

- [ ] 네이버 m.land.naver.com API 응답의 정확한 JSON 필드명 검증 필요 -- 비공식 API이므로 실제 호출하여 응답 구조를 확인해야 함. transform.ts 구현 시 실제 응답 기반으로 타입 보정 필요.
- [ ] 서울 467개 동의 중심좌표/경계좌표 데이터 확보 방법 확정 -- 네이버 지역 API에서 좌표를 제공하는지, 아니면 별도 공공데이터(국토교통부 법정동코드)에서 좌표를 매핑해야 하는지 확인 필요.
- [ ] 카카오맵에서 구/동 경계 폴리곤 표시 여부 -- 경계 폴리곤 GeoJSON 데이터가 필요한데, 공공데이터포털의 행정구역 데이터를 사용할지, 단순 마커만 사용할지 결정. 폴리곤 사용 시 MVP 범위 증가.
- [ ] 매물 상세 조회(fin.land.naver.com) API의 현재 작동 여부 -- Front API 엔드포인트가 추가 인증(토큰 등)을 요구할 수 있음. 작동하지 않으면 목록 API의 데이터만으로 상세 표시.
- [ ] Vercel Serverless Function Cold Start로 인한 첫 요청 지연 -- 네이버 API rate-limit 대기(500ms) + cold start가 합산되면 사용자 체감 지연이 클 수 있음. 대안으로 Edge Runtime 검토 가능하나 Node.js API 호환성 확인 필요.

## seoul-polygon-geojson - 2026-03-06

- [ ] GeoJSON 데이터 소스 최종 선택 -- SGIS(통계지리정보서비스), data.go.kr, GitHub 커뮤니티 리포(southkorea/seoul-maps) 중 어떤 소스를 사용할지. 각각 라이선스, 데이터 정확도, cortarNo 매핑 용이성이 다름.
- [ ] 동 단위 GeoJSON에서 cortarNo 매핑 전략 -- 공공데이터의 행정동코드와 네이버 법정동코드(cortarNo) 체계가 다를 수 있음. 법정동 vs 행정동 코드 변환 테이블이 필요할 수 있음.
- [ ] 동 단위 polygon 파일 크기가 5MB를 초과할 경우 분할 전략 -- 구별로 분할하여 25개 파일로 나눌지, 전체 1파일을 유지하고 simplification tolerance를 높일지 결정 필요.
- [ ] react-kakao-maps-sdk Polygon 컴포넌트의 nested path 지원 여부 확인 -- MultiPolygon(여러 링)을 단일 Polygon에 전달 가능한지, 아니면 여러 Polygon 컴포넌트로 분할 렌더링해야 하는지 SDK 문서 확인 필요.

## transit-walking-route - 2026-03-06

- [ ] 카카오 모빌리티 도보 길찾기 API 사용 가능 여부 확인 -- 카카오 모빌리티 Directions API가 도보 모드를 지원하는지 확인 필요. 미지원 시 Tmap 보행자 경로 API 또는 직선거리 기반 추정(80m/분)으로 폴백해야 함. API 선택에 따라 환경변수와 프록시 구현이 달라짐.
- [ ] KAKAO_REST_API_KEY 환경변수 확보 -- 서버 사이드에서 카카오 모빌리티 API 호출을 위한 REST API 키가 필요. 기존 NEXT_PUBLIC_KAKAO_APP_KEY와 별도인지, 같은 키로 사용 가능한지 카카오 개발자 콘솔에서 확인 필요.
- [ ] 카카오 Places API 카테고리 코드 정확성 -- 버스정류장(BW9 vs BS2)과 지하철역(SW8) 카테고리 코드가 현재 API 버전에서 유효한지 실제 호출로 검증 필요. 카카오 문서상 카테고리 코드가 변경될 수 있음.
- [ ] categorySearch 반경 기본값 결정 -- 1000m로 설정 시 도심 외곽에서 결과가 없을 수 있음. 결과 없을 때 반경을 2000m로 자동 확장할지, 고정 반경으로 유지하고 "주변에 정류장 없음"을 표시할지 결정 필요.

## kakao-to-naver-map-migration - 2026-03-06

- [ ] react-naver-maps Marker의 icon.content에서 onClick 이벤트 전파 여부 -- HTML 문자열 기반 커스텀 아이콘에서 내부 div의 onClick이 정상 동작하는지 확인 필요. 동작하지 않으면 Marker 자체의 onClick으로 대체하거나 useMap() 훅으로 네이티브 이벤트 리스너를 부착해야 함.
- [ ] react-naver-maps 컴포넌트가 plain object { lat, lng }를 받는지 naver.maps.LatLng 인스턴스만 받는지 -- 라이브러리가 자동 변환을 지원하면 코드가 단순해지고, 미지원 시 모든 좌표를 naver.maps.LatLng로 래핑하는 유틸 함수가 필요하다.
- [ ] Lucide SVG 인라인 변환 시 Tailwind 클래스 적용 여부 -- Marker icon.content는 React 밖의 HTML 문자열이므로 Tailwind 클래스가 적용되지 않을 수 있다. 인라인 style로 대체하거나 Tailwind의 JIT 빌드에 해당 클래스가 포함되도록 safelist 설정이 필요할 수 있음.
- [ ] react-naver-maps 0.1.x 버전의 Next.js 14 호환성 -- react-naver-maps 최신 버전이 Next.js 14 App Router와 호환되는지 확인. 특히 서버 컴포넌트에서의 import 이슈, "use client" 경계 처리가 올바른지 검증 필요.
