export type OxQuestion = {
  question: string;
  answer: "O" | "X";
};

export type TreasureClue = {
  clue: string;
  spotId: string;
};

/** 단체 행사에 맞는 가볍고 신박한 O/X */
export const SAMPLE_OX: OxQuestion[] = [
  { question: "형광등을 LED로 바꾸면 보통 전기요금이 내려간다.", answer: "O" },
  { question: "대기전력은 플러그를 뽑아도 계속 나간다.", answer: "X" },
  { question: "태양광 패널은 비 오는 날에도 아주 조금은 발전할 수 있다.", answer: "O" },
  { question: "에어컨 필터를 청소하면 전기 효율이 좋아질 수 있다.", answer: "O" },
  { question: "냉장고 문을 자주 여닫아도 전기 사용과는 무관하다.", answer: "X" },
  { question: "‘에너지 효율 1등급’은 대체로 전기를 덜 쓰는 제품이다.", answer: "O" },
  { question: "모니터를 밝게 할수록 전력 소모는 보통 줄어든다.", answer: "X" },
  { question: "엘리베이터 대신 계단을 쓰면 몸과 전기 둘 다 이득일 수 있다.", answer: "O" },
  { question: "휴대폰 100%가 되면 계속 꽂아둬도 전혀 손해가 없다.", answer: "X" },
  { question: "사무실에서 ‘마지막에 불 끄기’는 고전적이지만 여전히 유효하다.", answer: "O" },
  { question: "히트펌프는 기본적으로 ‘열을 옮기는’ 방식으로 작동한다.", answer: "O" },
  { question: "대기전력 차단 콘센트는 이름만 있고 실제 효과는 없다.", answer: "X" },
  { question: "여름철 실내온도를 1도만 높여도 냉방 에너지가 줄어들 수 있다.", answer: "O" },
  { question: "태양광은 밤에 가장 많이 발전한다.", answer: "X" },
  { question: "전력량계의 ‘kWh’는 전기 사용량을 나타내는 단위다.", answer: "O" },
  { question: "멀티탭에 빨간불이 켜져 있으면 보통 전원이 들어와 있는 것이다.", answer: "O" },
  { question: "창문으로 들어오는 햇볕은 냉방 부하와 전혀 관련이 없다.", answer: "X" },
  { question: "퇴근 전 PC 종료는 에너지효율부의 ‘기본기’에 가깝다.", answer: "O" },
  { question: "전기는 저장이 아예 불가능한 에너지다.", answer: "X" },
  { question: "오늘 이 자리에 모인 사람 중 ‘절전’을 한 번도 안 해본 사람은 없다… 아마도?", answer: "O" },
];

export const TREASURE_SPOTS = [
  { id: "gate", label: "입구", x: 18, y: 72 },
  { id: "trail", label: "숲길", x: 38, y: 58 },
  { id: "spring", label: "약수터", x: 58, y: 62 },
  { id: "bench", label: "쉼터", x: 28, y: 42 },
  { id: "view", label: "전망대", x: 68, y: 38 },
  { id: "peak", label: "정상", x: 52, y: 18 },
] as const;

export type TreasureSpotId = (typeof TREASURE_SPOTS)[number]["id"];

/** 오봉산 보물찾기 힌트 */
export const TREASURE_CLUES: TreasureClue[] = [
  { clue: "발걸음을 시작하는 곳. 배낭 메고 인증샷 찍는 그곳!", spotId: "gate" },
  { clue: "나뭇잎 사이로 발소리가 울리는 오르막길.", spotId: "trail" },
  { clue: "시원한 물 한 모금… 목이 마를 때 찾는 곳.", spotId: "spring" },
  { clue: "잠시 앉아 숨 고르기. 벤치가 반기는 곳.", spotId: "bench" },
  { clue: "대구 시내가 한눈에! 바람 맞으며 인증하는 자리.", spotId: "view" },
  { clue: "오봉산의 끝판왕. 올라온 사람만 아는 정상 공기.", spotId: "peak" },
  { clue: "보물은 ‘시작이 반’이라 했습니다. 산 입구를 보세요.", spotId: "gate" },
  { clue: "보물은 물가에 숨었습니다 했습니다. 졸졸 소리 나는 쪽!", spotId: "spring" },
  { clue: "보물은 하늘과 가장 가까운 돌 위에!", spotId: "peak" },
  { clue: "보물은 풍경을 자랑하는 난간 근처!", spotId: "view" },
];

export const LADDER_RESULTS = [
  "절전왕 후보",
  "박수 10초",
  "다음 미션",
  "보너스 +1점",
  "태양광 응원",
  "간식 우선권",
  "재도전 티켓",
  "오늘의 주인공",
];

export function pickOxQuestion(exclude: string[] = []): OxQuestion {
  const pool = SAMPLE_OX.filter((q) => !exclude.includes(q.question));
  const list = pool.length > 0 ? pool : SAMPLE_OX;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function pickTreasureClue(exclude: string[] = []): TreasureClue {
  const pool = TREASURE_CLUES.filter((q) => !exclude.includes(q.clue));
  const list = pool.length > 0 ? pool : TREASURE_CLUES;
  return list[Math.floor(Math.random() * list.length)]!;
}
