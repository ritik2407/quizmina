'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('quiz_attempts', [
      {
        id: 1,
        quizId: 1,
        userId: 3,
        status: 'completed',
        score: 7,
        percentage: 77.78,
        passed: true,
        currentDifficulty: 'medium',
        currentDifficultyScore: 0.55,
        totalQuestions: 5,
        answeredQuestions: 5,
        correctAnswers: 4,
        aiInsights: JSON.stringify({
          correctStreak: 2,
          wrongStreak: 0,
          difficultyHistory: [0.2, 0.5, 0.55, 0.25, 0.8],
          performanceSummary: 'Student showed strong arithmetic skills; moderate algebra performance. Recommend advancing to medium-hard questions.',
        }),
        startedAt: new Date(now.getTime() - 10 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * 60 * 1000),
        timeTaken: 300,
        createdAt: now,
        updatedAt: now,
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('quiz_attempts', null, {});
  },
};
