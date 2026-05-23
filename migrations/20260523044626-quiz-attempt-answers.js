'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quiz_attempt_answers', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      attemptId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'quiz_attempts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'questions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      /** Student's answer (label or text) */
      userAnswer: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      pointsEarned: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      /** Seconds spent on this question */
      timeTaken: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      /**
       * Numeric difficulty score (0–1) of the question when it was served.
       * Used by AI to decide the next question's difficulty.
       */
      difficultyAtTime: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      /** Whether AI adjusted difficulty after this answer */
      aiAdjustedNext: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      answeredAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quiz_attempt_answers');
  },
};
