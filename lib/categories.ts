export type Category = {
  slug: "about" | "work" | "resume" | "contact";
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
  {
    slug: "resume",
    number: "03",
    label: "Resume",
    title: "경력과 학력",
    blurb: "지금까지 거쳐 온 팀과 프로젝트를 시간순으로 정리했습니다.",
    href: "/resume",
  },
  {
    slug: "contact",
    number: "04",
    label: "Contact",
    title: "함께 일하기",
    blurb: "협업, R&D, 컨설팅 문의를 받습니다. 편하게 연락 주세요.",
    href: "/contact",
  },
];
