export class GameLogic {
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Generate a random problem from a specific list of Dans
    static getRandomProblemFromDans(dans) {
        if (!dans || dans.length === 0) return { a: 2, b: 2 }; // Default if empty

        // Pick a random dan from the list
        const a = dans[this.getRandomInt(0, dans.length - 1)];
        // 인도 19단: 10단 이상이면 곱하는 수도 19까지 확장
        const maxB = a >= 10 ? 19 : 9;

        // Ensure both a and b are >= 12 for Vedic Practice if used there, 
        // but here we are general.
        const b = this.getRandomInt(1, maxB);
        return { a, b };
    }

    // Generates specifically for Vedic practice (12-19 x 12-19)
    // Avoiding 10, 11 as they are trivial or have other tricks.
    static getVedicProblem() {
        return {
            a: this.getRandomInt(12, 19),
            b: this.getRandomInt(12, 19)
        };
    }

    // Generate distractors
    static generateChoices(a, b) {
        const answer = a * b;
        const choices = new Set();
        choices.add(answer);

        while (choices.size < 4) {
            const strategy = Math.random();
            let wrong;

            if (strategy < 0.4) {
                // Off by small amount
                wrong = answer + (Math.random() < 0.5 ? -1 : 1) * this.getRandomInt(1, 5);
            } else if (strategy < 0.7) {
                // Multiples error
                const offset = this.getRandomInt(1, 2) * (Math.random() < 0.5 ? -1 : 1);
                wrong = a * (b + offset);
            } else {
                // Random similar looking number
                const range = answer > 100 ? 20 : 10;
                wrong = this.getRandomInt(Math.max(2, answer - range), answer + range);
            }

            if (wrong > 0 && wrong !== answer) {
                choices.add(wrong);
            }
        }

        // Convert to array and shuffle
        return Array.from(choices).sort(() => Math.random() - 0.5);
    }
}
