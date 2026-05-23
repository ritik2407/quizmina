'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quiz_attempts', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      quizId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'quizzes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'abandoned'),
        defaultValue: 'in_progress',
      },
      /** Raw points earned */
      score: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      /** Percentage score (0–100) */
      percentage: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      passed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      currentDifficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
        comment: 'Current AI-adjusted difficulty label',
      },
      /** Numeric 0–1 score used by AI engine */
      currentDifficultyScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0.5,
      },
      totalQuestions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      answeredQuestions: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      correctAnswers: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      /**
       * AI context per session:
       * { correctStreak, wrongStreak, difficultyHistory[], performanceSummary }
       */
      aiInsights: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      timeTaken: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Total time taken in seconds',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quiz_attempts');
  },
};
