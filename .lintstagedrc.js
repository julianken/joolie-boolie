export default {
  '*': (stagedFiles) => {
    // Map staged file paths to turbo package filters
    const packageMap = {
      'apps/bingo/': '@hosted-game-night/bingo',
      'apps/trivia/': '@hosted-game-night/trivia',
      'packages/sync/': '@hosted-game-night/sync',
      'packages/ui/': '@hosted-game-night/ui',
      'packages/theme/': '@hosted-game-night/theme',
      'packages/types/': '@hosted-game-night/types',
      'packages/audio/': '@hosted-game-night/audio',
      'packages/game-stats/': '@hosted-game-night/game-stats',
      'packages/error-tracking/': '@hosted-game-night/error-tracking',
      'packages/testing/': '@hosted-game-night/testing',
    };

    const packages = new Set();
    for (const file of stagedFiles) {
      for (const [prefix, pkg] of Object.entries(packageMap)) {
        if (file.includes(prefix)) {
          packages.add(pkg);
          break;
        }
      }
    }

    if (packages.size === 0) return [];

    const filters = [...packages].map((p) => `--filter=${p}...`).join(' ');
    return [
      `turbo run lint ${filters}`,
      `turbo run typecheck ${filters}`,
      `turbo run test:run ${filters}`,
    ];
  },
};
