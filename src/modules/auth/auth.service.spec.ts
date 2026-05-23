import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Hash } from 'src/provider/hash/hash';
import { User } from 'src/models/User.model';
import { Token } from 'src/models/Token.model';
import { Role } from 'src/models/Role.model';
import { Notification } from 'src/models/Notification.model';

/**
 * Unit tests for AuthService
 *
 * All Sequelize model calls are mocked so no database is required.
 */
describe('AuthService', () => {
  let service: AuthService;

  // ─── Shared mock helpers ─────────────────────────────────────────────────────

  const mockRole = { id: 3, name: 'student' } as Role;

  const mockUser = {
    id: 1,
    email: 'student@quizminia.com',
    password: Hash.make('password123'),
    status: true,
    roleId: 3,
    firstName: 'John',
    lastName: 'Doe',
    role: mockRole,
    toJSON: function () {
      return { ...this };
    },
  } as unknown as User;

  const mockToken = {
    id: 10,
    token: 'abc123',
    userId: null,
    payload: {},
    getDataValue: jest.fn((key: string) => (mockToken as any)[key]),
    setDataValue: jest.fn((key: string, val: any) => {
      (mockToken as any)[key] = val;
    }),
  };

  const buildReq = () =>
    ({
      token: mockToken,
      user: null as any,
    }) as any;

  const buildRes = () =>
    ({
      clearCookie: jest.fn(),
    }) as any;

  const mockMailService = {
    sendWelcome: jest.fn().mockResolvedValue(true),
  } as any;

  beforeEach(() => {
    service = new AuthService(mockMailService);
    jest.clearAllMocks();
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'pass' }, buildReq()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.login({ email: mockUser.email, password: 'wrongpassword' }, buildReq()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when account is deactivated', async () => {
      const inactiveUser = { ...mockUser, status: false } as unknown as User;
      jest.spyOn(User, 'findOne').mockResolvedValue(inactiveUser);
      jest.spyOn(Hash, 'compare').mockReturnValue(true);

      await expect(
        service.login({ email: mockUser.email, password: 'password123' }, buildReq()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns safe user (no password) on successful login', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(Hash, 'compare').mockReturnValue(true);
      jest.spyOn(Token, 'update').mockResolvedValue([1]);

      const req = buildReq();
      const result = await service.login(
        { email: mockUser.email, password: 'password123' },
        req,
      );

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', mockUser.email);
    });
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws BadRequestException when email already exists', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.register(
          {
            email: mockUser.email,
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'student',
          },
          buildReq(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when role does not exist', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce(null); // no existing user
      jest.spyOn(Role, 'findOne').mockResolvedValue(null);     // role not found

      await expect(
        service.register(
          {
            email: 'new@test.com',
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'student',
          },
          buildReq(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates user and returns safe user on success', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(Role, 'findOne').mockResolvedValue(mockRole);
      jest.spyOn(User, 'create').mockResolvedValue({ id: 99 } as any);
      jest.spyOn(Token, 'update').mockResolvedValue([1]);
      jest.spyOn(Notification, 'create').mockResolvedValue({} as any);
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser);

      const req = buildReq();
      const result = await service.register(
        {
          email: 'new@test.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'student',
        },
        req,
      );

      expect(result).not.toHaveProperty('password');
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(Notification.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the auth cookie and unbinds the token', async () => {
      jest.spyOn(Token, 'update').mockResolvedValue([1]);

      const req = buildReq();
      const res = buildRes();
      const result = await service.logout(req, res);

      expect(Token.update).toHaveBeenCalledWith(
        { userId: null, payload: {} },
        expect.objectContaining({ where: { id: mockToken.id } }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith('auth');
      expect(result).toHaveProperty('message');
    });
  });

  // ─── me ──────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('returns the current user without password', async () => {
      const req = { ...buildReq(), user: mockUser } as any;
      const result = await service.me(req);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email', mockUser.email);
    });
  });
});
