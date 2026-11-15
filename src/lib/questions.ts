export type OxQuestion = {
  question: string;
  answer: "O" | "X";
};

/** 부서 행사 아이스브레이킹용 기본 O/X 문제 */
export const SAMPLE_OX: OxQuestion[] = [
  { question: "우리 팀에는 커피보다 차를 더 좋아하는 사람이 있다.", answer: "O" },
  { question: "오늘 행사장에 온 사람 중 반팔만 입은 사람이 있다.", answer: "O" },
  { question: "대한민국의 수도는 부산이다.", answer: "X" },
  { question: "1년은 365일 또는 366일이다.", answer: "O" },
  { question: "한글을 창제한 왕은 세종대왕이다.", answer: "O" },
  { question: "피카츄는 포켓몬스터에 나온다.", answer: "O" },
  { question: "지구는 태양 주위를 돈다.", answer: "O" },
  { question: "물(H2O)은 수소와 산소로 이루어져 있다.", answer: "O" },
  { question: "올림픽은 3년마다 열린다.", answer: "X" },
  { question: "삼각형의 내각의 합은 180도이다.", answer: "O" },
  { question: "사과는 채소이다.", answer: "X" },
  { question: "한국에서 가장 높은 산은 한라산이다.", answer: "O" },
  { question: "월요일은 주말의 하루이다.", answer: "X" },
  { question: "스마트폰으로 QR코드를 찍을 수 있다.", answer: "O" },
  { question: "북극에는 펭귄이 산다.", answer: "X" },
  { question: "가위바위보에서 보는 바위를 이긴다.", answer: "X" },
  { question: "커피의 카페인은 각성 효과가 있다.", answer: "O" },
  { question: "무지개는 보통 7가지 색으로 말한다.", answer: "O" },
  { question: "서울의 지하철 1호선은 파란색으로 알려져 있다.", answer: "O" },
  { question: "사람은 보통 하루에 세 끼를 먹는다.", answer: "O" },
];

export function pickOxQuestion(exclude: string[] = []): OxQuestion {
  const pool = SAMPLE_OX.filter((q) => !exclude.includes(q.question));
  const list = pool.length > 0 ? pool : SAMPLE_OX;
  return list[Math.floor(Math.random() * list.length)]!;
}
