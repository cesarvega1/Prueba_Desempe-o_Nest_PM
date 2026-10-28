import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkshopsService } from './workshops.service.js';
import { Workshop, WorkshopStatus } from './entities/workshop.entity.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';

describe('WorkshopsService', () => {
  let service: WorkshopsService;
  let mockWorkshopRepo: any;

  const mockWorkshop: Workshop = {
    id: 'ws-123',
    name: 'Taller Central FleetCore',
    address: 'Calle 123 #45-67',
    status: WorkshopStatus.ACTIVE,
    maintenances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockWorkshopRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        {
          provide: getRepositoryToken(Workshop),
          useValue: mockWorkshopRepo,
        },
      ],
    }).compile();

    service = module.get<WorkshopsService>(WorkshopsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a workshop', async () => {
      const dto: CreateWorkshopDto = {
        name: 'Taller Central FleetCore',
        address: 'Calle 123 #45-67',
      };

      mockWorkshopRepo.create.mockReturnValue(mockWorkshop);
      mockWorkshopRepo.save.mockResolvedValue(mockWorkshop);

      const result = await service.create(dto);

      expect(mockWorkshopRepo.create).toHaveBeenCalledWith(dto);
      expect(mockWorkshopRepo.save).toHaveBeenCalledWith(mockWorkshop);
      expect(result).toEqual(mockWorkshop);
    });
  });

  describe('findAll', () => {
    it('should return all workshops ordered by createdAt DESC', async () => {
      mockWorkshopRepo.find.mockResolvedValue([mockWorkshop]);

      const result = await service.findAll();

      expect(mockWorkshopRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockWorkshop]);
    });
  });

  describe('findActive', () => {
    it('should return active workshops ordered by name ASC', async () => {
      mockWorkshopRepo.find.mockResolvedValue([mockWorkshop]);

      const result = await service.findActive();

      expect(mockWorkshopRepo.find).toHaveBeenCalledWith({
        where: { status: WorkshopStatus.ACTIVE },
        order: { name: 'ASC' },
      });
      expect(result).toEqual([mockWorkshop]);
    });
  });

  describe('findOne', () => {
    it('should return a workshop by id', async () => {
      mockWorkshopRepo.findOne.mockResolvedValue(mockWorkshop);

      const result = await service.findOne('ws-123');

      expect(mockWorkshopRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ws-123' },
      });
      expect(result).toEqual(mockWorkshop);
    });

    it('should throw NotFoundException if workshop does not exist', async () => {
      mockWorkshopRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update workshop fields and save', async () => {
      const dto: UpdateWorkshopDto = { address: 'Nueva Calle 456' };
      mockWorkshopRepo.findOne.mockResolvedValue({ ...mockWorkshop });
      mockWorkshopRepo.save.mockImplementation((w: any) => Promise.resolve(w));

      const result = await service.update('ws-123', dto);

      expect(result.address).toBe('Nueva Calle 456');
      expect(mockWorkshopRepo.save).toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle from ACTIVE to INACTIVE', async () => {
      mockWorkshopRepo.findOne.mockResolvedValue({
        ...mockWorkshop,
        status: WorkshopStatus.ACTIVE,
      });
      mockWorkshopRepo.save.mockImplementation((w: any) => Promise.resolve(w));

      const result = await service.toggleStatus('ws-123');

      expect(result.status).toBe(WorkshopStatus.INACTIVE);
      expect(mockWorkshopRepo.save).toHaveBeenCalled();
    });

    it('should toggle from INACTIVE to ACTIVE', async () => {
      mockWorkshopRepo.findOne.mockResolvedValue({
        ...mockWorkshop,
        status: WorkshopStatus.INACTIVE,
      });
      mockWorkshopRepo.save.mockImplementation((w: any) => Promise.resolve(w));

      const result = await service.toggleStatus('ws-123');

      expect(result.status).toBe(WorkshopStatus.ACTIVE);
      expect(mockWorkshopRepo.save).toHaveBeenCalled();
    });
  });
});

