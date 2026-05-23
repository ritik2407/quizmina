import { AiService } from './ai.service';

/**
 * Unit tests for AiService
 *
 * These tests cover:
 *  1. scoreToLabel — difficulty score → label mapping
 *  2. ruleBasedAdaptive — deterministic fallback engine
 *  3. getNextDifficulty — falls back to rule engine when Bedrock is unavailable
 *  4. generateAnswerFeedback — returns existing explanation when provided
 *  5. fallbackSummary — correct summary generation
 *  6. fallbackGenerateQuestions — returns correct question count
 */
describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService();
  });

  // ─── scoreToLabel ────────────────────────────────────────────────────────────

  describe('scoreToLabel', () => {
    it('returns "easy" for score <= 0.35', () => {
      expect(service.scoreToLabel(0)).toBe('easy');
      expect(service.scoreToLabel(0.2)).toBe('easy');
      expect(service.scoreToLabel(0.35)).toBe('easy');
    });

    it('returns "medium" for score between 0.35 and 0.65', () => {
      expect(service.scoreToLabel(0.36)).toBe('medium');
      expect(service.scoreToLabel(0.5)).toBe('medium');
      expect(service.scoreToLabel(0.65)).toBe('medium');
    });

    it('returns "hard" for score > 0.65', () => {
      expect(service.scoreToLabel(0.66)).toBe('hard');
      expect(service.scoreToLabel(0.8)).toBe('hard');
      expect(service.scoreToLabel(1.0)).toBe('hard');
    });
  });

  // ─── ruleBasedAdaptive (via getNextDifficulty with mocked Bedrock) ───────────

  describe('getNextDifficulty (rule-based fallback)', () => {
    // Force Bedrock to fail so the rule engine is always used
    beforeEach(() => {
      jest
        .spyOn(service as any, 'invokeModel')
        .mockRejectedValue(new Error('Bedrock unavailable'));
    });

    afterEach(() => jest.restoreAllMocks());

    it('increases difficulty after a correct streak of 3', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: true,
        correctStreak: 3,
        wrongStreak: 0,
        difficultyHistory: [0.5, 0.5, 0.5],
        totalCorrect: 3,
        totalAnswered: 3,
      });

      expect(result.nextDifficultyScore).toBeGreaterThan(0.5);
      expect(result.aiAdjusted).toBe(false);
    });

    it('increases difficulty slightly after a correct streak of 2', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: true,
        correctStreak: 2,
        wrongStreak: 0,
        difficultyHistory: [0.5, 0.5],
        totalCorrect: 2,
        totalAnswered: 2,
      });

      expect(result.nextDifficultyScore).toBeCloseTo(0.6, 1);
    });

    it('decreases difficulty after a wrong streak of 3', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: false,
        correctStreak: 0,
        wrongStreak: 3,
        difficultyHistory: [0.5, 0.5, 0.5],
        totalCorrect: 0,
        totalAnswered: 3,
      });

      expect(result.nextDifficultyScore).toBeLessThan(0.5);
    });

    it('decreases difficulty slightly after a wrong streak of 2', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: false,
        correctStreak: 0,
        wrongStreak: 2,
        difficultyHistory: [0.5, 0.5],
        totalCorrect: 0,
        totalAnswered: 2,
      });

      expect(result.nextDifficultyScore).toBeCloseTo(0.4, 1);
    });

    it('nudges difficulty up slightly on a single correct answer', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: true,
        correctStreak: 1,
        wrongStreak: 0,
        difficultyHistory: [0.5],
        totalCorrect: 1,
        totalAnswered: 1,
      });

      expect(result.nextDifficultyScore).toBeCloseTo(0.55, 1);
    });

    it('nudges difficulty down slightly on a single wrong answer', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.5,
        isCorrect: false,
        correctStreak: 0,
        wrongStreak: 1,
        difficultyHistory: [0.5],
        totalCorrect: 0,
        totalAnswered: 1,
      });

      expect(result.nextDifficultyScore).toBeCloseTo(0.45, 1);
    });

    it('never exceeds 1.0', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.95,
        isCorrect: true,
        correctStreak: 5,
        wrongStreak: 0,
        difficultyHistory: [0.9, 0.95],
        totalCorrect: 5,
        totalAnswered: 5,
      });

      expect(result.nextDifficultyScore).toBeLessThanOrEqual(1.0);
    });

    it('never goes below 0.0', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.05,
        isCorrect: false,
        correctStreak: 0,
        wrongStreak: 5,
        difficultyHistory: [0.1, 0.05],
        totalCorrect: 0,
        totalAnswered: 5,
      });

      expect(result.nextDifficultyScore).toBeGreaterThanOrEqual(0.0);
    });

    it('returns the correct label for the computed score', async () => {
      const result = await service.getNextDifficulty({
        currentScore: 0.8,
        isCorrect: true,
        correctStreak: 3,
        wrongStreak: 0,
        difficultyHistory: [0.8],
        totalCorrect: 3,
        totalAnswered: 3,
      });

      expect(result.nextDifficultyLabel).toBe(
        service.scoreToLabel(result.nextDifficultyScore),
      );
    });
  });

  // ─── generateAnswerFeedback ──────────────────────────────────────────────────

  describe('generateAnswerFeedback', () => {
    it('returns the existing explanation without calling Bedrock', async () => {
      const invokeModelSpy = jest
        .spyOn(service as any, 'invokeModel')
        .mockResolvedValue('AI response');

      const result = await service.generateAnswerFeedback({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        givenAnswer: '4',
        isCorrect: true,
        explanation: 'Two plus two equals four.',
      });

      expect(result).toBe('Two plus two equals four.');
      expect(invokeModelSpy).not.toHaveBeenCalled();
      invokeModelSpy.mockRestore();
    });

    it('falls back to a default message when Bedrock fails and no explanation exists', async () => {
      jest
        .spyOn(service as any, 'invokeModel')
        .mockRejectedValue(new Error('Bedrock unavailable'));

      const result = await service.generateAnswerFeedback({
        questionText: 'What is 2+2?',
        correctAnswer: '4',
        givenAnswer: '5',
        isCorrect: false,
        explanation: null,
      });

      expect(result).toContain('4');
      jest.restoreAllMocks();
    });
  });

  // ─── fallbackGenerateQuestions ───────────────────────────────────────────────

  describe('generateQuestionsForQuiz (fallback)', () => {
    beforeEach(() => {
      jest
        .spyOn(service as any, 'invokeModel')
        .mockRejectedValue(new Error('Bedrock unavailable'));
    });

    afterEach(() => jest.restoreAllMocks());

    it('returns the requested number of questions', async () => {
      const questions = await service.generateQuestionsForQuiz({
        title: 'Math Quiz',
        description: null,
        subject: 'math',
        difficulty: 'medium',
        count: 3,
      });

      expect(questions).toHaveLength(3);
    });

    it('returns 5 questions by default', async () => {
      const questions = await service.generateQuestionsForQuiz({
        title: 'Science Quiz',
        description: null,
        subject: 'science',
        difficulty: 'easy',
      });

      expect(questions).toHaveLength(5);
    });

    it('each question has required fields', async () => {
      const questions = await service.generateQuestionsForQuiz({
        title: 'General Knowledge',
        description: null,
        subject: 'general',
        difficulty: 'medium',
        count: 2,
      });

      questions.forEach((q) => {
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('correctAnswer');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('difficultyScore');
        expect(Array.isArray(q.options)).toBe(true);
      });
    });

    it('returns short_answer formatted fallback questions when requested', async () => {
      const questions = await service.generateQuestionsForQuiz({
        title: 'Math Quiz',
        description: null,
        subject: 'math',
        difficulty: 'medium',
        count: 2,
        questionType: 'short_answer',
      });

      questions.forEach((q) => {
        expect(q.type).toBe('short_answer');
        expect(q.options).toBeNull();
        expect(typeof q.correctAnswer).toBe('string');
      });
    });

    it('returns true_false formatted fallback questions when requested', async () => {
      const questions = await service.generateQuestionsForQuiz({
        title: 'Science Quiz',
        description: null,
        subject: 'science',
        difficulty: 'easy',
        count: 2,
        questionType: 'true_false',
      });

      questions.forEach((q) => {
        expect(q.type).toBe('true_false');
        expect(q.options).toEqual(['A) True', 'B) False']);
        expect(q.correctAnswer).toBe('A');
      });
    });
  });
});
