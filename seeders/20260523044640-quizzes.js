'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Insert demo quiz (createdByUserId = 2 = teacher)
    await queryInterface.bulkInsert('quizzes', [
      {
        id: 1,
        title: 'Mathematics Fundamentals',
        description: 'Test your knowledge on basic algebra, geometry, and arithmetic. Questions adapt in real-time based on your performance.',
        subject: 'Mathematics',
        difficulty: 'medium',
        timeLimit: 30,
        passingScore: 60,
        totalQuestions: 5,
        isPublished: true,
        isAdaptive: true,
        scheduledAt: null,
        createdByUserId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: 'Science: Forces & Motion',
        description: 'Explore Newton\'s laws, gravity, and energy. Adaptive difficulty ensures you always learn at the right level.',
        subject: 'Science',
        difficulty: 'medium',
        timeLimit: 20,
        passingScore: 70,
        totalQuestions: 5,
        isPublished: true,
        isAdaptive: true,
        scheduledAt: null,
        createdByUserId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('quizzes', null, {});
  },
};
