import { Lightbulb, Clock, Calendar, Hash } from 'lucide-react';

export const getMathTip = (a, b) => {
    const answer = a * b;

    // 19단 (20의 마법) - 19 Dan specifically
    if (a === 19 || b === 19) {
        const target = a === 19 ? b : a;
        return (
            <div className="tip-box">
                <h4>🎩 19단: 20의 마법!</h4>
                <p>19는 20에서 1 모자란 수예요.</p>
                <div className="calc-steps">
                    1. <strong>{target} × 20</strong>을 먼저 해요 = <strong>{target * 20}</strong> <br />
                    2. 거기서 <strong>{target}</strong>을 한 번 빼주세요! <br />
                    👉 {target * 20} - {target} = <strong>{answer}</strong>
                </div>
            </div>
        );
    }

    // 15단 (시계 마법)
    if (a === 15 || b === 15) {
        return (
            <div className="tip-box">
                <h4>⏰ 15단: 시계 바늘 마법</h4>
                <p>15는 시계의 15분(3시 방향)과 같아요!</p>
                <p>
                    15가 2개 모이면 30분, <br />
                    4개 모이면 60분(1시간)이 되죠? <br />
                    <strong>15 × 4 = 60</strong>을 기억하면 쉬워요!
                </p>
            </div>
        );
    }

    // 12단 (1타스 마법)
    if (a === 12 || b === 12) {
        const target = a === 12 ? b : a;
        return (
            <div className="tip-box">
                <h4>✏️ 12단: 연필 한 타스</h4>
                <p>12는 10과 2의 합이에요.</p>
                <div className="calc-steps">
                    1. <strong>{target} × 10 = {target * 10}</strong> <br />
                    2. <strong>{target} × 2 = {target * 2}</strong> <br />
                    👉 둘을 더하면 <strong>{answer}</strong>!
                </div>
            </div>
        );
    }

    // 11단 (거울 쌍둥이)
    if (a === 11 || b === 11) {
        const target = a === 11 ? b : a;
        if (target < 10) {
            return (
                <div className="tip-box">
                    <h4>🪞 11단: 거울 쌍둥이</h4>
                    <p>11에 {target}을 곱하면 숫자가 거울처럼 복사돼요!</p>
                    <p>👉 <strong>{target}{target}</strong></p>
                </div>
            );
        } else {
            // 11 * 15 like 1(1+5)5 = 165
            const sum = Math.floor(target / 10) + (target % 10);
            return (
                <div className="tip-box">
                    <h4>👐 11단: 갈라치기 마법</h4>
                    <p>숫자를 양쪽으로 찢고, 둘을 더한 값을 가운데 넣으세요!</p>
                    <div className="calc-steps">
                        <strong>{target}</strong> 👉 {Math.floor(target / 10)} □ {target % 10} <br />
                        가운데: {Math.floor(target / 10)} + {target % 10} = {sum} <br />
                        정답: <strong>{answer}</strong>
                    </div>
                </div>
            );
        }
    }

    // 인도 베다 수학 (13~18단 범위)
    if ((a >= 13 && a <= 18) && (b >= 10 && b <= 19)) {
        const b_ones = b % 10;
        const a_ones = a % 10;
        return (
            <div className="tip-box">
                <h4>👳 인도 베다 수학 (3단계 비법)</h4>
                <div className="calc-steps">
                    1. 앞 수에 뒤 수의 꼬리(1의 자리)를 더해요: <br />
                    <strong>{a} + {b_ones} = {a + b_ones}</strong> <br />
                    2. 0을 하나 붙여요: <strong>{(a + b_ones) * 10}</strong> <br />
                    3. 꼬리끼리 곱해서 더해요 ({a_ones} × {b_ones}): <br />
                    <strong>{(a + b_ones) * 10} + {a_ones * b_ones} = {answer}</strong>!
                </div>
            </div>
        );
    }

    // 9단 (손가락)
    if (a === 9 || b === 9) {
        const target = a === 9 ? b : a;
        return (
            <div className="tip-box">
                <h4>🖐 9단: 손가락 계산기</h4>
                <p>열 손가락을 펴고 <strong>{target}번째</strong> 손가락을 접어보세요.</p>
                <p>
                    접은 손가락 왼쪽은 10의 자리 <strong>({target - 1})</strong>, <br />
                    오른쪽은 1의 자리 <strong>({10 - target})</strong>가 됩니다!
                </p>
            </div>
        );
    }

    // 7단 (달력)
    if (a === 7 || b === 7) {
        return (
            <div className="tip-box">
                <h4>📅 7단: 일주일 달력 마법</h4>
                <p>달력에서 일주일은 7일이죠?</p>
                <p>달력에서 한 칸 아래로 내려가면 7이 커져요. <br />(7, 14, 21, 28...)</p>
            </div>
        );
    }

    // 5단 (시계)
    if (a === 5 || b === 5) {
        return (
            <div className="tip-box">
                <h4>⌚ 5단: 시계 분침 마법</h4>
                <p>시계의 긴 바늘 숫자와 같아요!</p>
                <p>끝자리는 항상 <strong>0</strong> 아니면 <strong>5</strong>랍니다.</p>
            </div>
        );
    }

    // 6단 (5단 + 1)
    if (a === 6 || b === 6) {
        const target = a === 6 ? b : a;
        return (
            <div className="tip-box">
                <h4>짝꿍 6단</h4>
                <p>5단({a === 6 ? 5 : a} × {target})에 <strong>{target}</strong>을 한 번 더 더해보세요.</p>
                {target % 2 === 0 && (
                    <p>💡 짝수를 곱하면 1의 자리가 <strong>{target}</strong> 자신이 됩니다! (예: 6×{target}={a * b})</p>
                )}
            </div>
        );
    }

    // 3단
    if (a === 3 || b === 3) {
        return (
            <div className="tip-box">
                <h4>🐸 3단: 개구리 점프</h4>
                <p>수직선에서 3칸씩 폴짝! 폴짝! 뛰어보세요. (3, 6, 9...)</p>
            </div>
        );
    }

    // 4단, 8단 (두배)
    if (a === 4 || a === 8 || b === 4 || b === 8) {
        return (
            <div className="tip-box">
                <h4>✨ 두 배 마법!</h4>
                <p>2단 👉 두 배 하면 4단 👉 두 배 하면 8단!</p>
                <p>
                    2×{b} = {2 * b} <br />
                    4×{b} = {4 * b} (2단의 두 배) <br />
                    8×{b} = {8 * b} (4단의 두 배)
                </p>
            </div>
        );
    }

    // 2단
    if (a === 2 || b === 2) {
        return (
            <div className="tip-box">
                <h4>✌ 2단: 짝수 마법</h4>
                <p>둘씩 짝을 지어 세어보세요. (2, 4, 6, 8...)</p>
            </div>
        );
    }

    return null;
};
