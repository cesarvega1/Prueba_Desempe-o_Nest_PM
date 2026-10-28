import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockConfigService: any;

  const mockUser: User = {
    id: 'user-123',
    name: 'Juan Perez',
    email: 'juan@fleetcore.com',
    password: 'hashedpassword123',
    role: UserRole.TECHNICIAN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt-token-xyz'),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'supersecretkey1234567890123456';
        if (key === 'JWT_EXPIRES_IN') return 86400;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully and return user without password', async () => {
      const dto: RegisterDto = {
        name: 'Juan Perez',
        email: 'juan@fleetcore.com',
        password: 'Password123!',
      };

      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(dto.email);
    });

    it('should throw ConflictException if email is already registered', async () => {
      const dto: RegisterDto = {
        name: 'Juan Perez',
        email: 'juan@fleetcore.com',
        password: 'Password123!',
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login and return token and user profile on valid credentials', async () => {
      const dto: LoginDto = {
        email: 'juan@fleetcore.com',
        password: 'Password123!',
      };

      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      const qb: any = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(userWithPassword),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken', 'jwt-token-xyz');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto: LoginDto = {
        email: 'notfound@fleetcore.com',
        password: 'Password123!',
      };

      const qb: any = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const dto: LoginDto = {
        email: 'inactive@fleetcore.com',
        password: 'Password123!',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      const qb: any = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(inactiveUser),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const dto: LoginDto = {
        email: 'juan@fleetcore.com',
        password: 'WrongPassword!',
      };

      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      const userWithPassword = { ...mockUser, password: hashedPassword };

      const qb: any = {
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(userWithPassword),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile by id', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});

