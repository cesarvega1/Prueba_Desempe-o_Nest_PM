import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopsController } from './workshops.controller.js';
import { WorkshopsService } from './workshops.service.js';
import { WorkshopStatus } from './entities/workshop.entity.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('WorkshopsController', () => {
  let controller: WorkshopsController;
  let service: WorkshopsService;

  const mockWorkshop = {
    id: 'ws-123',
    name: 'Taller Central FleetCore',
    address: 'Calle 123 #45-67',
    status: WorkshopStatus.ACTIVE,
  };

  const mockWorkshopsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findActive: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopsController],
      providers: [
        {
          provide: WorkshopsService,
          useValue: mockWorkshopsService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkshopsController>(WorkshopsController);
    service = module.get<WorkshopsService>(WorkshopsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateWorkshopDto = {
        name: 'Taller Central FleetCore',
        address: 'Calle 123 #45-67',
      };
      mockWorkshopsService.create.mockResolvedValue(mockWorkshop);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockWorkshop);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockWorkshopsService.findAll.mockResolvedValue([mockWorkshop]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockWorkshop]);
    });
  });

  describe('findActive', () => {
    it('should call service.findActive', async () => {
      mockWorkshopsService.findActive.mockResolvedValue([mockWorkshop]);

      const result = await controller.findActive();

      expect(service.findActive).toHaveBeenCalled();
      expect(result).toEqual([mockWorkshop]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockWorkshopsService.findOne.mockResolvedValue(mockWorkshop);

      const result = await controller.findOne('ws-123');

      expect(service.findOne).toHaveBeenCalledWith('ws-123');
      expect(result).toEqual(mockWorkshop);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateWorkshopDto = { address: 'Calle 456' };
      mockWorkshopsService.update.mockResolvedValue({
        ...mockWorkshop,
        address: 'Calle 456',
      });

      const result = await controller.update('ws-123', dto);

      expect(service.update).toHaveBeenCalledWith('ws-123', dto);
      expect(result.address).toBe('Calle 456');
    });
  });

  describe('toggleStatus', () => {
    it('should call service.toggleStatus with id', async () => {
      mockWorkshopsService.toggleStatus.mockResolvedValue({
        ...mockWorkshop,
        status: WorkshopStatus.INACTIVE,
      });

      const result = await controller.toggleStatus('ws-123');

      expect(service.toggleStatus).toHaveBeenCalledWith('ws-123');
      expect(result.status).toBe(WorkshopStatus.INACTIVE);
    });
  });
});
