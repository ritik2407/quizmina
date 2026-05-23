'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add profile columns and quiz-related fields to the users table
    await queryInterface.addColumn('users', 'firstName', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'lastName', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'avatar', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'grade', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Student grade/class level',
    });
    await queryInterface.addColumn('users', 'subject', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Teacher subject specialization',
    });
    await queryInterface.addColumn('users', 'emailVerifiedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    // AI performance tracking
    await queryInterface.addColumn('users', 'performanceProfile', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'AI-computed performance profile: { avgScore, strengths[], weaknesses[], preferredDifficulty }',
    });
    await queryInterface.addColumn('users', 'totalQuizzesTaken', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
    await queryInterface.addColumn('users', 'totalScore', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      comment: 'Cumulative percentage score',
    });
  },

  async down(queryInterface) {
    const cols = [
      'firstName', 'lastName', 'avatar', 'bio', 'grade', 'subject',
      'emailVerifiedAt', 'deletedAt', 'performanceProfile',
      'totalQuizzesTaken', 'totalScore',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('users', col);
    }
  },
};
