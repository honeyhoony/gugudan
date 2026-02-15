export class GameLogic {
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Generate all problems from specified dans (default 2-9)
    static getAllProblems(dans = [2, 3, 4, 5, 6, 7, 8, 9]) {
        const problems = [];
        for (let a of dans) {
            for (let b = 1; b <= 9; b++) {
                problems.push({ a, b });
            }
        }
        return problems;
    }

    static getOrderProblems(dans) {
        return this.getAllProblems(dans);
    }

    static getReverseProblems(dans) {
        return this.getAllProblems(dans).reverse();
    }

    static getRandomProblems(limit = 30, dans) {
        const all = this.getAllProblems(dans);
        return all.sort(() => Math.random() - 0.5).slice(0, limit);
    }

    static getRandomProblem() {
        return {
            a: this.getRandomInt(2, 9),
            b: this.getRandomInt(1, 9)
        };
    }
}
