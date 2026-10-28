import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserRole } from '../users/entities/user.entity.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    getProfile: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with dto', async () => {
      const dto: RegisterDto = {
        name: 'Carlos',
        email: 'carlos@fleetcore.com',
        password: 'Password123!',
      };
      const response = {
        id: 'user-1',
        name: dto.name,
        email: dto.email,
        role: UserRole.TECHNICIAN,
      };
      mockAuthService.register.mockResolvedValue(response);

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto', async () => {
      const dto: LoginDto = {
        email: 'carlos@fleetcore.com',
        password: 'Password123!',
      };
      const response = {
        accessToken: 'jwt-token',
        user: { id: 'user-1', email: dto.email, role: UserRole.TECHNICIAN },
      };
      mockAuthService.login.mockResolvedValue(response);

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user sub', async () => {
      const userPayload: JwtPayload = {
        sub: 'user-1',
        email: 'carlos@fleetcore.com',
        role: UserRole.TECHNICIAN,
        name: 'Carlos',
      };
      const profile = { id: 'user-1', name: 'Carlos', email: 'carlos@fleetcore.com' };
      mockAuthService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(userPayload);

      expect(service.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(profile);
    });
  });
});
