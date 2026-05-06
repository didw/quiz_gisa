# 정보보안기사 실기 플래시카드 - 개발 가이드

## 프로젝트 개요

정보보안기사 실기 시험 대비 웹 플래시카드 앱. 빌드 도구/프레임워크 없이 순수 HTML/CSS/JS로 구성된 정적 사이트.

## 아키텍처

- **프론트엔드 전용**: `index.html` + `style.css` + `app.js` (단일 페이지)
- **데이터**: `data.json`에서 fetch로 로드 (서버 API 없음)
- **마크다운**: marked.js (CDN) — 카드 앞/뒷면 콘텐츠 렌더링
- **서버**: `python3 -m http.server` (`run.sh`)

## 핵심 파일

| 파일 | 역할 |
|---|---|
| `index.html` | DOM 구조 — 필터 바, 카드 씬(3D 플립), 네비게이션 |
| `style.css` | 반응형 레이아웃, 카테고리별 색상 테마, CSS 커스텀 프로퍼티 |
| `app.js` | 상태 관리, 필터링, 카드 렌더링, 시험 모드, 키보드/터치 이벤트 |
| `data.json` | 카드 데이터 배열 (id, category, subcategory, front, back, type, frequency) |

## 카드 데이터 스키마

```json
{
  "id": number,
  "category": "위험관리" | "시스템 보안" | "네트워크 보안" | "웹/애플리케이션 보안" | "법규 및 관리체계" | "침해사고 분석 및 대응",
  "subcategory": string,
  "front": string,       // 질문 (마크다운)
  "back": string,        // 답변 (마크다운)
  "type": "단답형" | "서술형" | "실무형" | "계산형",
  "frequency": "최빈출" | "일반"
}
```

## 주요 로직 (app.js)

- **상태**: `allCards`, `filteredCards`, `currentIndex`, `isFlipped`, `currentCategory/Type/Freq`, `examMode`
- **필터링**: `applyFilters()` — 카테고리 + 유형 + 빈도 3중 필터 조합
- **렌더링**: `renderCard()` — marked.parse() → sanitizeHtml() → innerHTML
- **시험 모드**: `startExam()` — 현재 필터 기준 Fisher-Yates 셔플 후 10장 추출
- **HTML 새니타이즈**: `sanitizeHtml()` — 허용 태그 화이트리스트 방식

## 개발 규칙

- **프레임워크 도입 금지**: 순수 JS 유지, 외부 의존성은 marked.js CDN만 허용
- **카드 추가 시**: `data.json`에 직접 추가, id는 기존 최대값 + 1
- **카테고리/유형 추가 시**: `data.json` + `index.html` 필터 버튼 + `style.css` 색상 동시 수정 필요
- **마크다운 콘텐츠**: front/back 필드에 마크다운 사용 가능 (표, 코드블록, 볼드 등)
- **보안**: `sanitizeHtml()`의 허용 태그 화이트리스트 유지 — script/img/iframe 등 차단

## 실행 및 테스트

```bash
./run.sh              # http://0.0.0.0:8080
PORT=3000 ./run.sh    # 포트 변경
```

브라우저에서 직접 확인 — 자동화 테스트 없음.

## 데이터 파이프라인

1. 원본 데이터: `quiz_data.md`, `new_data/` (json, txt, md)
2. 변환: `new_data/*_converted.json` — Claude로 스키마 변환
3. 병합: 변환 결과를 `data.json`에 통합
4. QA: `review_result.json` 기반 중복/오류 카드 정리
