import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service.js';
import {
  Maintenance,
  MaintenanceStatus,
  MaintenanceType,
} from './entities/maintenance.entity.js';
import { CreateMaintenanceDto, UpdateMaintenanceStatusDto } from './dto/maintenance.dto.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import { VehicleStatus } from '../vehicles/entities/vehicle.entity.js';
import { MechanicStatus } from '../mechanics/entities/mechanic.entity.js';
import { WorkshopStatus } from '../workshops/entities/workshop.entity.js';
import { UserRole } from '../users/entities/user.entity.js';

describe('MaintenancesService', () => {
  let service: MaintenancesService;
  let mockMaintenanceRepo: any;
  let mockVehiclesService: any;
  let mockMechanicsService: any;
  let mockWorkshopsService: any;

  const mockVehicle = {
    id: 'veh-1',
    plate: 'ABC-123',
    mileage: 50000,
    status: VehicleStatus.AVAILABLE,
  };

  const mockMechanic = {
    id: 'mech-1',
    name: 'Luis',
    email: 'luis@fleetcore.com',
    status: MechanicStatus.ACTIVE,
  };

  const mockWorkshop = {
    id: 'ws-1',
    name: 'Taller Central',
    status: WorkshopStatus.ACTIVE,
  };

  const mockMaintenance: Maintenance = {
    id: 'maint-1',
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite',
    mileage: 50000,
    scheduledDate: new Date('2026-11-01T08:00:00.000Z'),
    estimatedEndDate: new Date('2026-11-01T10:00:00.000Z'),
    status: MaintenanceStatus.SCHEDULED,
    workDone: null,
    finalCost: null,
    completedAt: null,
    finalMileage: null,
    vehicle: mockVehicle as any,
    vehicleId: 'veh-1',
    mechanic: mockMechanic as any,
    mechanicId: 'mech-1',
    workshop: mockWorkshop as any,
    workshopId: 'ws-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMaintenanceRepo = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockVehiclesService = {
      findOne: vi.fn().mockResolvedValue({ ...mockVehicle }),
      update: vi.fn().mockResolvedValue(true),
      updateStatus: vi.fn().mockResolvedValue(true),
    };

    mockMechanicsService = {
      findOne: vi.fn().mockResolvedValue({ ...mockMechanic }),
    };

    mockWorkshopsService = {
      findOne: vi.fn().mockResolvedValue({ ...mockWorkshop }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancesService,
        {
          provide: getRepositoryToken(Maintenance),
          useValue: mockMaintenanceRepo,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
        {
          provide: MechanicsService,
          useValue: mockMechanicsService,
        },
        {
          provide: WorkshopsService,
          useValue: mockWorkshopsService,
        },
      ],
    }).compile();

    service = module.get<MaintenancesService>(MaintenancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateMaintenanceDto = {
      type: MaintenanceType.PREVENTIVE,
      description: 'Cambio de aceite',
      mileage: 50000,
      scheduledDate: '2026-11-01T08:00:00.000Z',
      estimatedEndDate: '2026-11-01T10:00:00.000Z',
      vehicleId: 'veh-1',
      mechanicId: 'mech-1',
      workshopId: 'ws-1',
    };

    it('should create maintenance successfully', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMaintenanceRepo.find.mockResolvedValue([]); // No schedule conflicts
      mockMaintenanceRepo.create.mockReturnValue(mockMaintenance);
      mockMaintenanceRepo.save.mockResolvedValue(mockMaintenance);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMaintenance);
      expect(mockMaintenanceRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if vehicle is INACTIVE', async () => {
      mockVehiclesService.findOne.mockResolvedValue({
        ...mockVehicle,
        status: VehicleStatus.INACTIVE,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if vehicle already has an active maintenance', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if mechanic is INACTIVE', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMechanicsService.findOne.mockResolvedValue({
        ...mockMechanic,
        status: MechanicStatus.INACTIVE,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if mechanic has an overlapping maintenance', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMaintenanceRepo.find.mockResolvedValue([
        {
          id: 'existing-maint',
          mechanicId: 'mech-1',
          scheduledDate: new Date('2026-11-01T09:00:00.000Z'),
          estimatedEndDate: new Date('2026-11-01T11:00:00.000Z'),
          status: MaintenanceStatus.SCHEDULED,
        },
      ]);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if workshop is INACTIVE', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMaintenanceRepo.find.mockResolvedValue([]);
      mockWorkshopsService.findOne.mockResolvedValue({
        ...mockWorkshop,
        status: WorkshopStatus.INACTIVE,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if maintenance mileage is lower than current vehicle mileage', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      mockMaintenanceRepo.find.mockResolvedValue([]);

      const invalidMileageDto = { ...createDto, mileage: 40000 }; // current vehicle is 50000

      await expect(service.create(invalidMileageDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should transition from SCHEDULED to IN_PROGRESS and set vehicle status to IN_MAINTENANCE', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.SCHEDULED,
      });
      mockMaintenanceRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.IN_PROGRESS,
      };

      const result = await service.updateStatus('maint-1', dto, UserRole.ADMIN);

      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(mockVehiclesService.updateStatus).toHaveBeenCalledWith(
        'veh-1',
        VehicleStatus.IN_MAINTENANCE,
      );
    });

    it('should throw BadRequestException for invalid transition (e.g. SCHEDULED -> COMPLETED)', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.SCHEDULED,
      });

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.COMPLETED,
      };

      await expect(
        service.updateStatus('maint-1', dto, UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when completing without required closing fields', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.COMPLETED,
      };

      await expect(
        service.updateStatus('maint-1', dto, UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if finalMileage is less than vehicle mileage when completing', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Aceite cambiado',
        finalCost: 150000,
        completedAt: new Date().toISOString(),
        finalMileage: 40000, // less than 50000
      };

      await expect(
        service.updateStatus('maint-1', dto, UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete maintenance and update vehicle mileage and AVAILABLE status', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });
      mockMaintenanceRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Aceite cambiado y filtros reemplazados',
        finalCost: 150000,
        completedAt: new Date().toISOString(),
        finalMileage: 50100,
      };

      const result = await service.updateStatus('maint-1', dto, UserRole.ADMIN);

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.workDone).toBe(dto.workDone);
      expect(mockVehiclesService.update).toHaveBeenCalledWith('veh-1', {
        mileage: 50100,
        status: VehicleStatus.AVAILABLE,
      });
    });

    it('should restore vehicle to AVAILABLE when cancelling an IN_PROGRESS maintenance', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });
      mockMaintenanceRepo.save.mockImplementation((m: any) => Promise.resolve(m));

      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.CANCELLED,
      };

      const result = await service.updateStatus('maint-1', dto, UserRole.ADMIN);

      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
      expect(mockVehiclesService.updateStatus).toHaveBeenCalledWith(
        'veh-1',
        VehicleStatus.AVAILABLE,
      );
    });
  });

  describe('query methods', () => {
    it('findAll should return all maintenances', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);
      const result = await service.findAll();
      expect(result).toEqual([mockMaintenance]);
    });

    it('findActive should return active maintenances', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);
      const result = await service.findActive();
      expect(result).toEqual([mockMaintenance]);
    });

    it('findOne should return a maintenance by id', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(mockMaintenance);
      const result = await service.findOne('maint-1');
      expect(result).toEqual(mockMaintenance);
    });

    it('findOne should throw NotFoundException if not found', async () => {
      mockMaintenanceRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });

    it('findByVehicle should return maintenances for a vehicle', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);
      const result = await service.findByVehicle('veh-1');
      expect(result).toEqual([mockMaintenance]);
    });

    it('findByMechanic should return maintenances for a mechanic', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);
      const result = await service.findByMechanic('mech-1');
      expect(result).toEqual([mockMaintenance]);
    });

    it('getVehicleHistory should return completed and cancelled maintenances', async () => {
      mockMaintenanceRepo.find.mockResolvedValue([mockMaintenance]);
      const result = await service.getVehicleHistory('veh-1');
      expect(result).toEqual([mockMaintenance]);
    });
  });
});

