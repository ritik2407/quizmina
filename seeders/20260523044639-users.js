'use strict';

const { pbkdf2Sync, randomBytes } = require('crypto');

/**
 * Hash a password using PBKDF2 (same algorithm as Hash.make() in provider/hash/hash.ts)
 */
function hashPassword(password) {
  const SALT_LENGTH = 32;
  const HASH_LENGTH = 64;
  const ITERATIONS = 1000;
  const DIGEST = 'sha512';
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        email: 'admin@quizminia.com',
        password: hashPassword('Admin@12345'),
        status: true,
        roleId: 1,
        firstName: 'System',
        lastName: 'Admin',
        totalQuizzesTaken: 0,
        totalScore: 0,
        performanceProfile: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        email: 'teacher@quizminia.com',
        password: hashPassword('Teacher@12345'),
        status: true,
        roleId: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        subject: 'Mathematics',
        bio: 'Experienced math teacher with 10+ years of teaching.',
        totalQuizzesTaken: 0,
        totalScore: 0,
        performanceProfile: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        email: 'student@quizminia.com',
        password: hashPassword('Student@12345'),
        status: true,
        roleId: 3,
        firstName: 'John',
        lastName: 'Smith',
        grade: 'Grade 10',
        bio: 'Eager learner who loves science and math.',
        totalQuizzesTaken: 0,
        totalScore: 0,
        performanceProfile: JSON.stringify({ avgScore: 0, strengths: [], weaknesses: [], preferredDifficulty: 'medium' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@quizminia.com', 'teacher@quizminia.com', 'student@quizminia.com'],
    }, {});
  },
};
