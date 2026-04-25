import type { Block } from "./blocks";

export type MediaItem =
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      caption?: string;
      autoplay?: boolean;
    };

export type Project = {
  slug: string;
  title: string;
  category: "Project" | "Personal";
  /** Required only when category === "Project". */
  company?: string;
  /** ISO date string YYYY-MM-DD. Project start date. */
  startDate?: string;
  /** ISO date string YYYY-MM-DD. Project end date. */
  endDate?: string;
  role: string;
  tags: string[];
  summary: string;
  /** Cover / thumbnail image URL or data URL. Shown on list cards and hero. */
  coverImage?: string;
  /** Markdown body — always source of truth for rendering. */
  body: string;
  /** When set, the post was edited in block mode; preserves structure for round-trip editing. */
  blocks?: Block[];
  media: MediaItem[];
  links?: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    slug: "project-aurora",
    title: "Project Aurora — Dynamic Sky System",
    category: "Project",
    company: "Studio Placeholder",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    role: "Lead Technical Artist",
    tags: ["Unreal", "HLSL", "Niagara"],
    summary:
      "오픈월드용 절차적 하늘/구름 시스템과 시간대 라이팅 파이프라인 구축.",
    body: `## 문제

기존 스카이돔 기반 솔루션은 시간대 전환에서 색역과 구름 변화를 동시에 다루기 어려웠고, 라이팅 룩이 신마다 흔들렸습니다.

## 접근

물리 기반 atmospheric scattering과 raymarched 볼류메트릭 클라우드를 결합해 시간대 LUT을 자동 생성하는 파이프라인을 설계했습니다.

## 결과

- 라이팅 셋업 시간이 신당 4시간에서 30분으로 단축
- 신간 룩 일관성 개선
- LUT 자동화로 아티스트 반복 작업 제거`,
    media: [],
  },
  {
    slug: "toolchain-refactor",
    title: "Toolchain Refactor",
    category: "Project",
    company: "Studio Placeholder",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    role: "Pipeline TA",
    tags: ["Python", "Maya", "Pipeline"],
    summary: "에셋 익스포트 시간을 60% 단축한 Maya/Houdini 통합 익스포터.",
    body: `## 배경

Maya와 Houdini 사이를 오가는 환경 에셋 워크플로우에서 익스포트 단계가 병목이었습니다.

## 구현

공통 에셋 디스크립터를 정의하고, DCC별 익스포터를 동일 인터페이스로 묶는 Python 라이브러리를 만들었습니다. 빌드 머신에서 헤드리스 검증도 함께 도입.

## 임팩트

- 평균 익스포트 시간 60% 감소
- 검수 자동화로 휴먼 에러 리포트 1/3 수준`,
    media: [],
  },
  {
    slug: "stylized-water-shader",
    title: "Stylized Water Shader",
    category: "Personal",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    role: "Solo R&D",
    tags: ["Unity", "HLSL", "Shader"],
    summary: "토론 셰이딩 기반의 스타일라이즈드 워터 셰이더와 인터랙션 시스템.",
    body: `## 목표

비사실적이지만 일관된 라이팅을 제공하는 워터 룩 개발과 동적 인터랙션 실험.

## 기술

Toon-shaded specular, foam mask, depth-based caustics, GPU 트레일을 결합한 단일 머티리얼 구성.`,
    media: [],
  },
  {
    slug: "procedural-vegetation",
    title: "Procedural Vegetation Tool",
    category: "Personal",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    role: "Solo R&D",
    tags: ["Houdini", "Python"],
    summary: "Houdini Digital Asset 기반 절차적 식생 배치 도구 프로토타입.",
    body: `## 아이디어

지형 마스크와 생태 규칙을 입력으로 받아, 식생 종/밀도/회전 배치를 일괄 생성하는 HDA.

## 결과

Unreal Foliage 시스템과 호환되는 인스턴스 데이터를 익스포트하도록 마무리.`,
    media: [],
  },
  {
    slug: "mobile-fx-optimization",
    title: "Mobile FX Optimization",
    category: "Project",
    company: "Game Company A",
    startDate: "2022-01-01",
    endDate: "2022-12-31",
    role: "Technical Artist",
    tags: ["Unity", "Profiler", "GPU"],
    summary: "모바일 GPU 프로파일링과 셰이더 단순화로 평균 프레임 18% 향상.",
    body: `## 분석

RenderDoc/Xcode GPU Capture로 핫 패스를 식별, 오버드로우와 알파 블렌딩 비용에 집중.

## 조치

- 이펙트 머티리얼 LOD 도입
- 파티클 셰이더 단순화
- 텍스처 포맷 전수 점검`,
    media: [],
  },
  {
    slug: "realtime-hair-shader",
    title: "Realtime Hair Shader R&D",
    category: "Personal",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    role: "Solo R&D",
    tags: ["Unreal", "HLSL", "R&D"],
    summary: "이방성 스페큘러 모델 비교 및 마쉬너-카지야 변형 셰이더 연구.",
    body: `## 비교

Kajiya–Kay, Marschner, Marschner-near-field 변형을 성능/룩 관점에서 비교 평가.

## 산출물

각 모델의 성능 프로파일과 권장 사용 시나리오를 정리한 내부 R&D 노트.`,
    media: [],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function formatDate(date?: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  if (!y) return "";
  if (!m) return y;
  if (!d) return `${y}.${m}`;
  return `${y}.${m}.${d}`;
}

export function formatProjectDate(start?: string, end?: string): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} —`;
  if (e) return `— ${e}`;
  return "";
}
