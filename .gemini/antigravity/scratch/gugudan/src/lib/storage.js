const STORAGE_KEY = 'gugudan_users';

export class StorageService {
  static getUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  static saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  static getUser(name) {
    const users = this.getUsers();
    if (!users[name]) {
      // Create new user
      users[name] = {
        name,
        stats: {}, // '2x3': { correct: 0, wrong: 0 }
        history: [], // recent attempts
        createdAt: new Date().toISOString()
      };
      this.saveUsers(users);
    }
    return users[name];
  }

  static updateStats(name, a, b, isCorrect) {
    const users = this.getUsers();
    const user = users[name];
    if (!user) return;

    const key = `${a}x${b}`;
    if (!user.stats[key]) {
      user.stats[key] = { correct: 0, wrong: 0 };
    }

    if (isCorrect) {
      user.stats[key].correct += 1;
    } else {
      user.stats[key].wrong += 1;
    }

    user.history.push({
      key,
      isCorrect,
      timestamp: new Date().toISOString()
    });

    // Keep history manageable (last 100)
    if (user.history.length > 100) {
      user.history.shift();
    }

    this.saveUsers(users);
    return user;
  }

  static getWeakProblems(name) {
    const user = this.getUser(name);
    const weak = [];
    
    // Scan stats for problems where wrong > 0 OR correct/total < 80% (if total > 3)
    Object.entries(user.stats).forEach(([key, stat]) => {
      const [a, b] = key.split('x').map(Number);
      const total = stat.correct + stat.wrong;
      
      if (total === 0) return;

      // Simple heuristic: If wrong count is high relative to correct
      // Or simply if wrong > 0 for beginners to retry
      const ratio = stat.correct / total;

      if (stat.wrong > 0 && (ratio < 0.8 || stat.wrong > stat.correct)) {
        weak.push({ a, b, stat });
      }
    });

    return weak;
  }
}
