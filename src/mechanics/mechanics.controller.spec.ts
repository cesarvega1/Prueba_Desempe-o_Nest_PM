import { Test, TestingModule } from '@nestjs/testing';
import { MechanicsController } from './mechanics.controller.js';
import { MechanicsService } from './mechanics.service.js';
import { MechanicStatus } from './entities/mechanic.entity.js';
import { CreateMechanicDto, UpdateMechanicDto } from './dto/mechanic.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('MechanicsController', () => {
  let controller: MechanicsController;
  let service: MechanicsService;

  const mockMechanic = {
    id: 'mech-123',
    name: 'Carlos Rodríguez',
    email: 'carlos@fleetcore.com',
    specialty: 'Frenos y suspensión',
    status: MechanicStatus.ACTIVE,
  };

  const mockMechanicsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MechanicsController],
      providers: [
        {
          provide: MechanicsService,
          useValue: mockMechanicsService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MechanicsController>(MechanicsController);
    service = module.get<MechanicsService>(MechanicsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateMechanicDto = {
        name: 'Carlos Rodríguez',
        email: 'carlos@fleetcore.com',
        specialty: 'Frenos y suspensión',
      };
      mockMechanicsService.create.mockResolvedValue(mockMechanic);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMechanic);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockMechanicsService.findAll.mockResolvedValue([mockMechanic]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMechanic]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockMechanicsService.findOne.mockResolvedValue(mockMechanic);

      const result = await controller.findOne('mech-123');

      expect(service.findOne).toHaveBeenCalledWith('mech-123');
      expect(result).toEqual(mockMechanic);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateMechanicDto = { specialty: 'Transmisión' };
      mockMechanicsService.update.mockResolvedValue({
        ...mockMechanic,
        specialty: 'Transmisión',
      });

      const result = await controller.update('mech-123', dto);

      expect(service.update).toHaveBeenCalledWith('mech-123', dto);
      expect(result.specialty).toBe('Transmisión');
    });
  });

  describe('toggleStatus', () => {
    it('should call service.toggleStatus with id', async () => {
      mockMechanicsService.toggleStatus.mockResolvedValue({
        ...mockMechanic,
        status: MechanicStatus.INACTIVE,
      });

      const result = await controller.toggleStatus('mech-123');

      expect(service.toggleStatus).toHaveBeenCalledWith('mech-123');
      expect(result.status).toBe(MechanicStatus.INACTIVE);
    });
  });
});
