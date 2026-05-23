import { Test, TestingModule } from '@nestjs/testing';
import { Hash } from './hash';

describe('Hash', () => {
  let provider: Hash;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Hash],
    }).compile();

    provider = module.get<Hash>(Hash);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
