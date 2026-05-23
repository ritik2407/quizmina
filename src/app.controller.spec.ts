import { AppController } from './app.controller';
import { User } from './models/User.model';

/**
 * Unit tests for AppController (page routing)
 *
 * All DB calls and Express objects are mocked — no database required.
 */
describe('AppController', () => {
  let controller: AppController;

  const mockRes = () => ({
    redirect: jest.fn(),
    render: jest.fn(),
    clearCookie: jest.fn(),
  });

  const mockReq = (userId: number | null = null) => ({
    token: {
      getDataValue: jest.fn().mockReturnValue(userId),
    },
  });

  beforeEach(() => {
    controller = new AppController();
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── GET / ───────────────────────────────────────────────────────────────────

  describe('index', () => {
    it('redirects to /dashboard when user is logged in', async () => {
      const req = mockReq(1) as any;
      const res = mockRes() as any;
      await controller.index(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects to /login when no session', async () => {
      const req = mockReq(null) as any;
      const res = mockRes() as any;
      await controller.index(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });
  });

  // ─── GET /login ──────────────────────────────────────────────────────────────

  describe('login', () => {
    it('renders login page when not authenticated', async () => {
      const req = mockReq(null) as any;
      const res = mockRes() as any;
      await controller.login(req, res);
      expect(res.render).toHaveBeenCalledWith('login');
    });

    it('redirects to /dashboard when already authenticated', async () => {
      const req = mockReq(1) as any;
      const res = mockRes() as any;
      await controller.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ─── GET /register ───────────────────────────────────────────────────────────

  describe('register', () => {
    it('renders register page when not authenticated', async () => {
      const req = mockReq(null) as any;
      const res = mockRes() as any;
      await controller.register(req, res);
      expect(res.render).toHaveBeenCalledWith('register');
    });

    it('redirects to /dashboard when already authenticated', async () => {
      const req = mockReq(1) as any;
      const res = mockRes() as any;
      await controller.register(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ─── GET /dashboard ──────────────────────────────────────────────────────────

  describe('dashboard', () => {
    it('redirects to /login when not authenticated', async () => {
      const req = mockReq(null) as any;
      const res = mockRes() as any;
      await controller.dashboard(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('redirects to /login and clears cookie when user is inactive', async () => {
      const req = mockReq(1) as any;
      const res = mockRes() as any;
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        status: false,
        role: { name: 'student' },
      } as any);
      await controller.dashboard(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith('auth');
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('renders teacher view for teacher role', async () => {
      const req = mockReq(2) as any;
      const res = mockRes() as any;
      const mockUser = { status: true, role: { name: 'teacher' } };
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any);
      await controller.dashboard(req, res);
      expect(res.render).toHaveBeenCalledWith('teacher', { user: mockUser });
    });

    it('renders teacher view for admin role', async () => {
      const req = mockReq(1) as any;
      const res = mockRes() as any;
      const mockUser = { status: true, role: { name: 'admin' } };
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any);
      await controller.dashboard(req, res);
      expect(res.render).toHaveBeenCalledWith('teacher', { user: mockUser });
    });

    it('renders student view for student role', async () => {
      const req = mockReq(3) as any;
      const res = mockRes() as any;
      const mockUser = { status: true, role: { name: 'student' } };
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUser as any);
      await controller.dashboard(req, res);
      expect(res.render).toHaveBeenCalledWith('student', { user: mockUser });
    });
  });
});
