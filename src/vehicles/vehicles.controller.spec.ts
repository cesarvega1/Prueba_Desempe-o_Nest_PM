import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';
import { VehicleStatus } from './entities/vehicle.entity.js';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehicle = {
    id: 'veh-123',
    plate: 'ABC-123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2022,
    mileage: 15000,
    status: VehicleStatus.AVAILABLE,
  };

  const mockVehiclesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPlate: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateVehicleDto = {
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        mileage: 15000,
      };
      mockVehiclesService.create.mockResolvedValue(mockVehicle);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockVehiclesService.findAll.mockResolvedValue([mockVehicle]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockVehicle]);
    });
  });

  describe('findByPlate', () => {
    it('should call service.findByPlate', async () => {
      mockVehiclesService.findByPlate.mockResolvedValue(mockVehicle);

      const result = await controller.findByPlate('ABC-123');

      expect(service.findByPlate).toHaveBeenCalledWith('ABC-123');
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne('veh-123');

      expect(service.findOne).toHaveBeenCalledWith('veh-123');
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateVehicleDto = { mileage: 20000 };
      mockVehiclesService.update.mockResolvedValue({ ...mockVehicle, ...dto });

      const result = await controller.update('veh-123', dto);

      expect(service.update).toHaveBeenCalledWith('veh-123', dto);
      expect(result).toEqual({ ...mockVehicle, ...dto });
    });
  });

  describe('deactivate', () => {
    it('should call service.deactivate with id', async () => {
      mockVehiclesService.deactivate.mockResolvedValue({
        ...mockVehicle,
        status: VehicleStatus.INACTIVE,
      });

      const result = await controller.deactivate('veh-123');

      expect(service.deactivate).toHaveBeenCalledWith('veh-123');
      expect(result.status).toBe(VehicleStatus.INACTIVE);
    });
  });
});
