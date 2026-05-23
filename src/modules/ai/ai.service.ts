import { Injectable, Logger } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface AdaptiveResult {
  nextDifficultyScore: number;
  nextDifficultyLabel: 'easy' | 'medium' | 'hard';
  aiAdjusted: boolean;
  insights: string;
}

export interface PerformanceSummaryResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  avgScore: number;
}

/**
 * AI Service — AWS Bedrock with google.gemma-3-4b-it
 *
 * Responsibilities:
 *  1. Compute the next question's adaptive difficulty score based on performance
 *  2. Generate per-answer AI feedback / explanations
 *  3. Produce end-of-quiz performance summaries
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: BedrockRuntimeClient;
  private readonly MODEL_ID = 'google.gemma-3-4b-it';

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // ─── Adaptive Difficulty ────────────────────────────────────────────────────

  /**
   * Determines the next question's difficulty score (0–1) using the student's
   * recent performance history. Also returns a human-readable insight.
   *
   * Algorithm:
   *  - If AI is unavailable, falls back to a deterministic rule-based engine.
   *  - Correct streak ≥ 2 → increase difficulty
   *  - Wrong streak ≥ 2  → decrease difficulty
   *  - Otherwise         → nudge toward historical average
   */
  async getNextDifficulty(params: {
    currentScore: number;          // current difficulty score 0-1
    isCorrect: boolean;
    correctStreak: number;
    wrongStreak: number;
    difficultyHistory: number[];   // last N difficulty scores
    totalCorrect: number;
    totalAnswered: number;
  }): Promise<AdaptiveResult> {
    try {
      const prompt = this.buildAdaptivePrompt(params);
      const raw = await this.invokeModel(prompt, 200);
      return this.parseAdaptiveResponse(raw, params);
    } catch (err) {
      console.log(err);
      this.logger.warn(`Bedrock unavailable, using rule engine: ${err.message}`);
      return this.ruleBasedAdaptive(params);
    }
  }

  // ─── Performance Summary ─────────────────────────────────────────────────────

  /**
   * Generates a full end-of-attempt performance summary.
   * Called when a quiz attempt is completed.
   */
  async generatePerformanceSummary(params: {
    quizTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    difficultyHistory: number[];
    tags: string[][];   // tags per question
    correctFlags: boolean[];
  }): Promise<PerformanceSummaryResult> {
    try {
      const prompt = this.buildSummaryPrompt(params);
      const raw = await this.invokeModel(prompt, 512);
      return this.parseSummaryResponse(raw, params);
    } catch (err) {
      console.log(err);
      this.logger.warn(`Bedrock summary failed, using fallback: ${err.message}`);
      return this.fallbackSummary(params);
    }
  }

  // ─── Answer Feedback ──────────────────────────────────────────────────────────

  /**
   * Generates concise AI feedback for a single answered question.
   */
  async generateAnswerFeedback(params: {
    questionText: string;
    correctAnswer: string;
    givenAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
  }): Promise<string> {
    if (params.explanation) return params.explanation;

    try {
      const prompt = `You are a helpful quiz tutor. A student answered a question.\n\nQuestion: "${params.questionText}"\nStudent's answer: "${params.givenAnswer}"\nCorrect answer: "${params.correctAnswer}"\nResult: ${params.isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}\n\nWrite a concise 1-2 sentence explanation helping the student understand the correct answer. Be encouraging.`;
      return (await this.invokeModel(prompt, 150)).trim();
    } catch {
      return params.isCorrect
        ? `Great job! "${params.correctAnswer}" is correct.`
        : `The correct answer is "${params.correctAnswer}". Review this topic to strengthen your understanding.`;
    }
  }

  // ─── Internal: Bedrock Invocation ────────────────────────────────────────────

  private async invokeModel(prompt: string, maxTokens: number): Promise<string> {
    const body = JSON.stringify({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
      top_p: 0.9,
    });

    const command = new InvokeModelCommand({
      modelId: this.MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body,
    });

    const response = await this.client.send(command);
    const decoded = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(decoded);

    return (
      parsed.choices?.[0]?.message?.content ??
      parsed.generation ??
      parsed.outputs?.[0]?.text ??
      parsed.text ??
      parsed.completion ??
      ''
    );
  }

  // ─── Prompt Builders ─────────────────────────────────────────────────────────

  private buildAdaptivePrompt(p: typeof AiService.prototype.getNextDifficulty extends (x: infer T) => any ? T : never): string {
    const accuracy = p.totalAnswered > 0
      ? ((p.totalCorrect / p.totalAnswered) * 100).toFixed(0)
      : '0';

    return `You are an adaptive learning AI. Based on a student's quiz performance, determine the next question's difficulty.

Current difficulty score (0=easy, 1=hard): ${p.currentScore.toFixed(2)}
Last answer: ${p.isCorrect ? 'CORRECT' : 'INCORRECT'}
Consecutive correct streak: ${p.correctStreak}
Consecutive wrong streak: ${p.wrongStreak}
Overall accuracy: ${accuracy}%
Recent difficulty history (last ${p.difficultyHistory.length} questions): [${p.difficultyHistory.map(d => d.toFixed(2)).join(', ')}]

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"score": 0.00, "label": "easy|medium|hard", "insight": "one sentence reason"}

Rules:
- score must be between 0.0 and 1.0
- easy = 0.0–0.35, medium = 0.35–0.65, hard = 0.65–1.0
- If correct streak >= 2, increase difficulty
- If wrong streak >= 2, decrease difficulty
- Never jump more than 0.25 in one step`;
  }

  private buildSummaryPrompt(p: any): string {
    const topicAccuracy: Record<string, { correct: number; total: number }> = {};
    p.tags.forEach((tagList: string[], idx: number) => {
      tagList.forEach(tag => {
        if (!topicAccuracy[tag]) topicAccuracy[tag] = { correct: 0, total: 0 };
        topicAccuracy[tag].total++;
        if (p.correctFlags[idx]) topicAccuracy[tag].correct++;
      });
    });

    const topicStr = Object.entries(topicAccuracy)
      .map(([t, { correct, total }]) => `${t}: ${correct}/${total}`)
      .join(', ');

    return `You are a learning analytics AI. Analyze a student's quiz performance and provide structured feedback.

Quiz: "${p.quizTitle}"
Score: ${p.correctAnswers}/${p.totalQuestions} (${p.percentage.toFixed(1)}%)
Topic accuracy: ${topicStr || 'N/A'}

Respond with ONLY a JSON object:
{"summary": "2-3 sentence overall assessment", "strengths": ["topic1", "topic2"], "weaknesses": ["topic3"], "recommendedDifficulty": "easy|medium|hard"}`;
  }

  // ─── Response Parsers ─────────────────────────────────────────────────────────

  private parseAdaptiveResponse(raw: string, fallbackParams: any): AdaptiveResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);

      const score = Math.max(0, Math.min(1, Number(parsed.score) || 0.5));
      return {
        nextDifficultyScore: score,
        nextDifficultyLabel: this.scoreToLabel(score),
        aiAdjusted: true,
        insights: parsed.insight || 'Difficulty adjusted by AI.',
      };
    } catch {
      return this.ruleBasedAdaptive(fallbackParams);
    }
  }

  private parseSummaryResponse(raw: string, fallbackParams: any): PerformanceSummaryResult {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendedDifficulty: (['easy', 'medium', 'hard'].includes(parsed.recommendedDifficulty)
          ? parsed.recommendedDifficulty
          : 'medium') as any,
        avgScore: fallbackParams.percentage,
      };
    } catch {
      return this.fallbackSummary(fallbackParams);
    }
  }

  // ─── Rule-Based Fallback ──────────────────────────────────────────────────────

  private ruleBasedAdaptive(p: {
    currentScore: number;
    isCorrect: boolean;
    correctStreak: number;
    wrongStreak: number;
    difficultyHistory: number[];
    totalCorrect: number;
    totalAnswered: number;
  }): AdaptiveResult {
    let next = p.currentScore;
    let insight = 'Difficulty maintained.';

    if (p.correctStreak >= 3) {
      next = Math.min(1, next + 0.2);
      insight = 'Great streak! Moving to harder questions.';
    } else if (p.correctStreak === 2) {
      next = Math.min(1, next + 0.1);
      insight = 'Good progress! Slightly increasing difficulty.';
    } else if (p.wrongStreak >= 3) {
      next = Math.max(0, next - 0.2);
      insight = 'Let\'s try easier questions to build confidence.';
    } else if (p.wrongStreak === 2) {
      next = Math.max(0, next - 0.1);
      insight = 'Stepping back slightly to reinforce fundamentals.';
    } else if (p.isCorrect) {
      next = Math.min(1, next + 0.05);
      insight = 'Correct! Slight difficulty increase.';
    } else {
      next = Math.max(0, next - 0.05);
      insight = 'Slight difficulty decrease to help consolidate learning.';
    }

    return {
      nextDifficultyScore: Math.round(next * 100) / 100,
      nextDifficultyLabel: this.scoreToLabel(next),
      aiAdjusted: false,
      insights: insight,
    };
  }

  private fallbackSummary(p: any): PerformanceSummaryResult {
    const pct = p.percentage as number;
    const label = pct >= 80 ? 'hard' : pct >= 50 ? 'medium' : 'easy';
    return {
      summary: `You scored ${pct.toFixed(1)}% on "${p.quizTitle}". ${pct >= 60 ? 'Well done!' : 'Keep practising!'}`,
      strengths: [],
      weaknesses: [],
      recommendedDifficulty: label as any,
      avgScore: pct,
    };
  }

  // ─── AI Question Generation ──────────────────────────────────────────────────

  async generateQuestionsForQuiz(params: {
    title: string;
    description: string | null;
    subject: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    count?: number;
    questionType?: string;
  }): Promise<any[]> {
    const count = params.count || 5;
    const qType = params.questionType || 'mixed';

    let typeInstruction = '';
    if (qType === 'multiple_choice') {
      typeInstruction = `Each question must have "type": "multiple_choice" and "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"]. The "correctAnswer" must be the letter of the correct option (A, B, C, or D).`;
    } else if (qType === 'true_false') {
      typeInstruction = `Each question must have "type": "true_false" and "options": ["A) True", "B) False"]. The "correctAnswer" must be A (for True) or B (for False).`;
    } else if (qType === 'short_answer') {
      typeInstruction = `Each question must have "type": "short_answer" and "options": null. The "correctAnswer" must be a concise, short phrase or value (case-insensitive string).`;
    } else {
      typeInstruction = `Each question can be any of the three types: "multiple_choice" (requires 4 options, correctAnswer must be A/B/C/D), "true_false" (requires 2 options: "A) True" and "B) False", correctAnswer must be A or B), or "short_answer" (requires options to be null, correctAnswer must be a brief string). Return a mix of these.`;
    }

    try {
      const prompt = `You are a professional educational curriculum creator. Generate a list of exactly ${count} questions for a quiz with the following attributes:
Title: "${params.title}"
Description: "${params.description || ''}"
Subject: "${params.subject || ''}"
Base Difficulty: "${params.difficulty}"

${typeInstruction}

Respond with ONLY a valid JSON array of objects in this exact schema (do not include any markdown format tags like \`\`\`json, do not write introduction or wrap in object, return ONLY the raw JSON array string):
[
  {
    "text": "question text",
    "type": "multiple_choice|true_false|short_answer",
    "difficulty": "easy|medium|hard",
    "difficultyScore": 0.3,
    "options": ["A) option 1", "B) option 2", ...] or null,
    "correctAnswer": "correct answer representation (e.g. A, B, or a short string)",
    "explanation": "explanation text",
    "points": 1,
    "tags": ["tag1", "tag2"]
  }
]`;

      const raw = await this.invokeModel(prompt, 1500);
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');
      return parsed;
    } catch (err) {
      this.logger.warn(`Failed to generate questions via Bedrock, using fallback: ${err.message}`);
      return this.fallbackGenerateQuestions({ ...params, questionType: qType });
    }
  }

  private fallbackGenerateQuestions(params: {
    title: string;
    description: string | null;
    subject: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    count?: number;
    questionType?: string;
  }): any[] {
    const count = params.count || 5;
    const qType = params.questionType || 'mixed';
    const subj = (params.subject || params.title || '').toLowerCase();

    if (subj.includes('math') || subj.includes('algebra') || subj.includes('calculus')) {
      const mathPool = [
        {
          text: 'What is the value of x if 3x - 7 = 14?',
          options: ['A) 5', 'B) 7', 'C) 9', 'D) 11'],
          correctAnswer: 'B',
          explanation: 'Add 7 to both sides to get 3x = 21, then divide by 3 to get x = 7.',
          difficulty: 'easy',
          difficultyScore: 0.25,
          tags: ['algebra', 'equations'],
        },
        {
          text: 'Solve for x: x^2 - 16 = 0',
          options: ['A) 4', 'B) -4', 'C) 4 or -4', 'D) 8'],
          correctAnswer: 'C',
          explanation: 'x^2 = 16. Taking the square root of both sides gives x = 4 or x = -4.',
          difficulty: 'medium',
          difficultyScore: 0.5,
          tags: ['algebra', 'quadratics'],
        },
        {
          text: 'What is the derivative of f(x) = 3x^2 + 5x - 2 with respect to x?',
          options: ['A) 6x + 5', 'B) 3x + 5', 'C) 6x^2 + 5', 'D) 6x'],
          correctAnswer: 'A',
          explanation: 'Using the power rule: d/dx(3x^2) = 6x and d/dx(5x) = 5.',
          difficulty: 'medium',
          difficultyScore: 0.6,
          tags: ['calculus', 'derivatives'],
        },
        {
          text: 'Find the area under the curve y = 2x from x = 0 to x = 3.',
          options: ['A) 6', 'B) 9', 'C) 12', 'D) 15'],
          correctAnswer: 'B',
          explanation: 'The integral of 2x is x^2. Evaluated from 0 to 3: 3^2 - 0^2 = 9.',
          difficulty: 'hard',
          difficultyScore: 0.75,
          tags: ['calculus', 'integration'],
        },
        {
          text: 'What is the value of log10(1000)?',
          options: ['A) 2', 'B) 3', 'C) 4', 'D) 10'],
          correctAnswer: 'B',
          explanation: 'Since 10^3 = 1000, the logarithm of 1000 to base 10 is 3.',
          difficulty: 'easy',
          difficultyScore: 0.3,
          tags: ['math', 'logarithms'],
        },
      ];
      return this.formatFallbackQuestions(mathPool.slice(0, count), qType);
    } else if (subj.includes('science') || subj.includes('physic') || subj.includes('chem')) {
      const sciencePool = [
        {
          text: 'What is the chemical symbol for Water?',
          options: ['A) H2O', 'B) CO2', 'C) O2', 'D) H2'],
          correctAnswer: 'A',
          explanation: 'Water molecules consist of two hydrogen atoms and one oxygen atom (H2O).',
          difficulty: 'easy',
          difficultyScore: 0.15,
          tags: ['chemistry', 'basics'],
        },
        {
          text: 'Which planet is known as the Red Planet?',
          options: ['A) Venus', 'B) Mars', 'C) Jupiter', 'D) Saturn'],
          correctAnswer: 'B',
          explanation: 'Mars is called the Red Planet because iron minerals in its soil oxidize (rust), making the soil and atmosphere look red.',
          difficulty: 'easy',
          difficultyScore: 0.2,
          tags: ['astronomy', 'planets'],
        },
        {
          text: 'What is the acceleration due to gravity on Earth?',
          options: ['A) 8.9 m/s^2', 'B) 9.8 m/s^2', 'C) 10.5 m/s^2', 'D) 12.0 m/s^2'],
          correctAnswer: 'B',
          explanation: 'The standard acceleration due to gravity on Earth is approximately 9.8 meters per second squared.',
          difficulty: 'medium',
          difficultyScore: 0.45,
          tags: ['physics', 'gravity'],
        },
        {
          text: 'What is the speed of light in a vacuum?',
          options: ['A) ~150,000 km/s', 'B) ~300,000 km/s', 'C) ~450,000 km/s', 'D) ~600,000 km/s'],
          correctAnswer: 'B',
          explanation: 'The speed of light in a vacuum is approximately 299,792 kilometers per second (~300,000 km/s).',
          difficulty: 'medium',
          difficultyScore: 0.55,
          tags: ['physics', 'light'],
        },
        {
          text: 'Which subatomic particle has a negative charge?',
          options: ['A) Proton', 'B) Neutron', 'C) Electron', 'D) Quark'],
          correctAnswer: 'C',
          explanation: 'Electrons carry a negative charge, protons carry a positive charge, and neutrons carry no charge.',
          difficulty: 'medium',
          difficultyScore: 0.4,
          tags: ['physics', 'atoms'],
        },
      ];
      return this.formatFallbackQuestions(sciencePool.slice(0, count), qType);
    } else {
      const generalPool = [
        {
          text: 'Who painted the Mona Lisa?',
          options: ['A) Vincent van Gogh', 'B) Leonardo da Vinci', 'C) Pablo Picasso', 'D) Michelangelo'],
          correctAnswer: 'B',
          explanation: 'The Mona Lisa was painted by the Italian Renaissance artist Leonardo da Vinci.',
          difficulty: 'easy',
          difficultyScore: 0.25,
          tags: ['art', 'history'],
        },
        {
          text: 'What is the capital of France?',
          options: ['A) London', 'B) Berlin', 'C) Rome', 'D) Paris'],
          correctAnswer: 'D',
          explanation: 'Paris is the capital and most populous city of France.',
          difficulty: 'easy',
          difficultyScore: 0.1,
          tags: ['geography', 'capitals'],
        },
        {
          text: 'Which is the largest ocean on Earth?',
          options: ['A) Atlantic Ocean', 'B) Indian Ocean', 'C) Pacific Ocean', 'D) Arctic Ocean'],
          correctAnswer: 'C',
          explanation: 'The Pacific Ocean is the largest and deepest of Earth\'s oceanic divisions.',
          difficulty: 'medium',
          difficultyScore: 0.45,
          tags: ['geography', 'oceans'],
        },
        {
          text: 'How many bones are there in an adult human body?',
          options: ['A) 186', 'B) 206', 'C) 216', 'D) 256'],
          correctAnswer: 'B',
          explanation: 'An adult human skeleton consists of 206 bones.',
          difficulty: 'medium',
          difficultyScore: 0.5,
          tags: ['biology', 'anatomy'],
        },
        {
          text: 'Who wrote the play "Romeo and Juliet"?',
          options: ['A) William Shakespeare', 'B) Charles Dickens', 'C) Mark Twain', 'D) Jane Austen'],
          correctAnswer: 'A',
          explanation: '"Romeo and Juliet" is a tragedy written by William Shakespeare early in his career.',
          difficulty: 'easy',
          difficultyScore: 0.2,
          tags: ['literature', 'theater'],
        },
      ];
      return this.formatFallbackQuestions(generalPool.slice(0, count), qType);
    }
  }

  private formatFallbackQuestions(questions: any[], qType: string): any[] {
    return questions.map(item => {
      if (qType === 'true_false') {
        const isA = item.correctAnswer === 'A';
        return {
          text: `Is this statement true: ${item.text} (Answer: ${item.options[0].replace(/^[A-D]\)\s*/i, '')})`,
          options: ['A) True', 'B) False'],
          correctAnswer: 'A',
          explanation: item.explanation,
          difficulty: item.difficulty,
          difficultyScore: item.difficultyScore,
          tags: item.tags,
          type: 'true_false',
          points: 1,
        };
      } else if (qType === 'short_answer') {
        const correctOptIndex = item.correctAnswer.charCodeAt(0) - 65;
        const cleanAnswer = item.options[correctOptIndex]
          ? item.options[correctOptIndex].replace(/^[A-D]\)\s*/i, '')
          : 'Answer';
        return {
          text: item.text,
          options: null,
          correctAnswer: cleanAnswer,
          explanation: item.explanation,
          difficulty: item.difficulty,
          difficultyScore: item.difficultyScore,
          tags: item.tags,
          type: 'short_answer',
          points: 1,
        };
      } else {
        // multiple_choice or mixed
        return {
          ...item,
          type: 'multiple_choice',
          points: 1,
        };
      }
    });
  }

  // ─── Utils ───────────────────────────────────────────────────────────────────

  scoreToLabel(score: number): 'easy' | 'medium' | 'hard' {
    if (score <= 0.35) return 'easy';
    if (score <= 0.65) return 'medium';
    return 'hard';
  }
}
