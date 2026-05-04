export type Category = {
  slug: "about" | "work";
  number: string;
  label: string;
  title: string;
  blurb: string;
  href: `/${string}`;
};

export const categories: Category[] = [
  {
    slug: "about",
    number: "01",
    label: "About",
    title: "소개와 전문 분야",
    blurb:
      "테크니컬 아티스트로서 시각적 비전과 기술적 실현 가능성을 잇는 작업을 합니다.",
    href: "/about",
  },
  {
    slug: "work",
    number: "02",
    label: "Work",
    title: "프로젝트 모음",
    blurb: "셰이더, 파이프라인, R&D 작업을 영상과 이미지로 자세히 풀어 둔 공간.",
    href: "/work",
  },
];
