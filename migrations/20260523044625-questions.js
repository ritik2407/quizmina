'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('questions', {
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
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('multiple_choice', 'true_false', 'short_answer'),
        defaultValue: 'multiple_choice',
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
      },
      /** Numeric difficulty score (0–1) used by the AI engine */
      difficultyScore: {
        type: Sequelize.FLOAT,
        defaultValue: 0.5,
      },
      /** Array of {label, text} objects for MC / true-false */
      options: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      correctAnswer: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      /** AI-generated explanation shown after student answers */
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      aiGenerated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      /** Topic tags used by AI to group questions and identify weak areas */
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
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
    await queryInterface.dropTable('questions');
  },
};
