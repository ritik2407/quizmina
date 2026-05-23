import { Test, TestingModule } from '@nestjs/testing';
import { TokenManager } from './token-manager';

describe('TokenManager', () => {
  let provider: TokenManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenManager],
    }).compile();

    provider = module.get<TokenManager>(TokenManager);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
