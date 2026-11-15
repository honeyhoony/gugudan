export type OxQuestion = {
  question: string;
  answer: "O" | "X";
};

/** 팩트 기반 기본 O/X — 주관식은 진행자가 직접 입력 */
export const SAMPLE_OX: OxQuestion[] = [
  { question: "대한민국의 수도는 부산이다.", answer: "X" },
  { question: "1년은 365일 또는 366일이다.", answer: "O" },
  { question: "한글을 창제한 왕은 세종대왕이다.", answer: "O" },
  { question: "지구는 태양 주위를 돈다.", answer: "O" },
  { question: "물(H₂O)은 수소와 산소로 이루어져 있다.", answer: "O" },
  { question: "올림픽은 3년마다 열린다.", answer: "X" },
  { question: "삼각형의 내각의 합은 180도이다.", answer: "O" },
  { question: "사과는 채소이다.", answer: "X" },
  { question: "한국에서 가장 높은 산은 한라산이다.", answer: "O" },
  { question: "월요일은 주말의 하루이다.", answer: "X" },
  { question: "북극에는 펭귄이 산다.", answer: "X" },
  { question: "가위바위보에서 보는 바위를 이긴다.", answer: "X" },
  { question: "무지개는 보통 7가지 색으로 말한다.", answer: "O" },
  { question: "사람의 심장은 보통 왼쪽에 치우쳐 있다.", answer: "O" },
  { question: "커피의 카페인은 각성 효과가 있다.", answer: "O" },
  { question: "피카츄는 포켓몬스터에 나온다.", answer: "O" },
  { question: "1km는 100m이다.", answer: "X" },
  { question: "태극기의 건곤감리는 네 모서리에 있다.", answer: "O" },
  { question: "한글날은 10월 9일이다.", answer: "O" },
  { question: "남극과 북극은 같은 곳이다.", answer: "X" },
];

export function pickOxQuestion(exclude: string[] = []): OxQuestion {
  const pool = SAMPLE_OX.filter((q) => !exclude.includes(q.question));
  const list = pool.length > 0 ? pool : SAMPLE_OX;
  return list[Math.floor(Math.random() * list.length)]!;
}
