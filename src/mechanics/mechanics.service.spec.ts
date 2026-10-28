import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MechanicsService } from './mechanics.service.js';
import { Mechanic, MechanicStatus } from './entities/mechanic.entity.js';
import { CreateMechanicDto, UpdateMechanicDto } from './dto/mechanic.dto.js';

describe('MechanicsService', () => {
  let service: MechanicsService;
  let mockMechanicRepo: any;

  const mockMechanic: Mechanic = {
    id: 'mech-123',
    name: 'Carlos Rodríguez',
    email: 'carlos@fleetcore.com',
    specialty: 'Frenos y suspensión',
    status: MechanicStatus.ACTIVE,
    maintenances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMechanicRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MechanicsService,
        {
          provide: getRepositoryToken(Mechanic),
          useValue: mockMechanicRepo,
        },
      ],
    }).compile();

    service = module.get<MechanicsService>(MechanicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new mechanic if email does not exist', async () => {
      const dto: CreateMechanicDto = {
        name: 'Carlos Rodríguez',
        email: 'carlos@fleetcore.com',
        specialty: 'Frenos y suspensión',
      };

      mockMechanicRepo.findOne.mockResolvedValue(null);
      mockMechanicRepo.create.mockReturnValue(mockMechanic);
      mockMechanicRepo.save.mockResolvedValue(mockMechanic);

      const result = await service.create(dto);

      expect(mockMechanicRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockMechanicRepo.create).toHaveBeenCalledWith(dto);
      expect(mockMechanicRepo.save).toHaveBeenCalledWith(mockMechanic);
      expect(result).toEqual(mockMechanic);
    });

    it('should throw ConflictException if mechanic email already exists', async () => {
      const dto: CreateMechanicDto = {
        name: 'Carlos Rodríguez',
        email: 'carlos@fleetcore.com',
        specialty: 'Frenos y suspensión',
      };

      mockMechanicRepo.findOne.mockResolvedValue(mockMechanic);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockMechanicRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all mechanics ordered by name ASC', async () => {
      mockMechanicRepo.find.mockResolvedValue([mockMechanic]);

      const result = await service.findAll();

      expect(mockMechanicRepo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockMechanic]);
    });
  });

  describe('findOne', () => {
    it('should return a mechanic if found', async () => {
      mockMechanicRepo.findOne.mockResolvedValue(mockMechanic);

      const result = await service.findOne('mech-123');

      expect(mockMechanicRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'mech-123' },
      });
      expect(result).toEqual(mockMechanic);
    });

    it('should throw NotFoundException if mechanic is not found', async () => {
      mockMechanicRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update mechanic details successfully', async () => {
      const dto: UpdateMechanicDto = { specialty: 'Transmisión' };
      mockMechanicRepo.findOne.mockResolvedValue({ ...mockMechanic });
      mockMechanicRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const result = await service.update('mech-123', dto);

      expect(result.specialty).toBe('Transmisión');
      expect(mockMechanicRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new email is already in use by another mechanic', async () => {
      const dto: UpdateMechanicDto = { email: 'used@fleetcore.com' };
      mockMechanicRepo.findOne
        .mockResolvedValueOnce({ ...mockMechanic }) // findOne by id
        .mockResolvedValueOnce({ id: 'mech-other', email: 'used@fleetcore.com' }); // email check

      await expect(service.update('mech-123', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('toggleStatus', () => {
    it('should toggle status from ACTIVE to INACTIVE', async () => {
      mockMechanicRepo.findOne.mockResolvedValue({
        ...mockMechanic,
        status: MechanicStatus.ACTIVE,
      });
      mockMechanicRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const result = await service.toggleStatus('mech-123');

      expect(result.status).toBe(MechanicStatus.INACTIVE);
      expect(mockMechanicRepo.save).toHaveBeenCalled();
    });

    it('should toggle status from INACTIVE to ACTIVE', async () => {
      mockMechanicRepo.findOne.mockResolvedValue({
        ...mockMechanic,
        status: MechanicStatus.INACTIVE,
      });
      mockMechanicRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const result = await service.toggleStatus('mech-123');

      expect(result.status).toBe(MechanicStatus.ACTIVE);
      expect(mockMechanicRepo.save).toHaveBeenCalled();
    });
  });
});

