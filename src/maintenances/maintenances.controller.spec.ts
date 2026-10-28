import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MaintenancesController } from './maintenances.controller.js';
import { MaintenancesService } from './maintenances.service.js';
import { MaintenanceStatus, MaintenanceType } from './entities/maintenance.entity.js';
import { CreateMaintenanceDto, UpdateMaintenanceStatusDto } from './dto/maintenance.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ApiKeyGuard } from '../auth/guards/api-key.guard.js';
import { UserRole } from '../users/entities/user.entity.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

describe('MaintenancesController', () => {
  let controller: MaintenancesController;
  let service: MaintenancesService;

  const mockMaintenance = {
    id: 'maint-1',
    type: MaintenanceType.PREVENTIVE,
    description: 'Cambio de aceite',
    status: MaintenanceStatus.SCHEDULED,
    mechanic: { email: 'tech1@fleetcore.com' },
  };

  const mockMaintenancesService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findActive: vi.fn(),
    getVehicleHistory: vi.fn(),
    findByVehicle: vi.fn(),
    findByMechanic: vi.fn(),
    findOne: vi.fn(),
    updateStatus: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenancesController],
      providers: [
        {
          provide: MaintenancesService,
          useValue: mockMaintenancesService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MaintenancesController>(MaintenancesController);
    service = module.get<MaintenancesService>(MaintenancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto', async () => {
      const dto: CreateMaintenanceDto = {
        type: MaintenanceType.PREVENTIVE,
        description: 'Test',
        mileage: 10000,
        scheduledDate: '2026-11-01',
        vehicleId: 'veh-1',
        mechanicId: 'mech-1',
        workshopId: 'ws-1',
      };
      mockMaintenancesService.create.mockResolvedValue(mockMaintenance);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      mockMaintenancesService.findAll.mockResolvedValue([mockMaintenance]);
      const result = await controller.findAll();
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('findActive', () => {
    it('should call service.findActive', async () => {
      mockMaintenancesService.findActive.mockResolvedValue([mockMaintenance]);
      const result = await controller.findActive();
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('findActiveExternal', () => {
    it('should call service.findActive for external integration', async () => {
      mockMaintenancesService.findActive.mockResolvedValue([mockMaintenance]);
      const result = await controller.findActiveExternal();
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('getVehicleHistory', () => {
    it('should call service.getVehicleHistory with vehicleId', async () => {
      mockMaintenancesService.getVehicleHistory.mockResolvedValue([mockMaintenance]);
      const result = await controller.getVehicleHistory('veh-1');
      expect(service.getVehicleHistory).toHaveBeenCalledWith('veh-1');
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('findByVehicle', () => {
    it('should call service.findByVehicle with vehicleId', async () => {
      mockMaintenancesService.findByVehicle.mockResolvedValue([mockMaintenance]);
      const result = await controller.findByVehicle('veh-1');
      expect(service.findByVehicle).toHaveBeenCalledWith('veh-1');
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('findByMechanic', () => {
    it('should call service.findByMechanic with mechanicId', async () => {
      const user: JwtPayload = {
        sub: 'user-1',
        email: 'admin@fleetcore.com',
        role: UserRole.ADMIN,
        name: 'Admin',
      };
      mockMaintenancesService.findByMechanic.mockResolvedValue([mockMaintenance]);
      const result = await controller.findByMechanic('mech-1', user);
      expect(service.findByMechanic).toHaveBeenCalledWith('mech-1');
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      mockMaintenancesService.findOne.mockResolvedValue(mockMaintenance);
      const result = await controller.findOne('maint-1');
      expect(service.findOne).toHaveBeenCalledWith('maint-1');
      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('updateStatus', () => {
    it('should allow ADMIN to update status without checking ownership', async () => {
      const user: JwtPayload = {
        sub: 'admin-1',
        email: 'admin@fleetcore.com',
        role: UserRole.ADMIN,
        name: 'Admin',
      };
      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.IN_PROGRESS,
      };
      mockMaintenancesService.updateStatus.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });

      const result = await controller.updateStatus('maint-1', dto, user);

      expect(service.updateStatus).toHaveBeenCalledWith('maint-1', dto, user.role);
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('should allow TECHNICIAN to update status if maintenance is assigned to them', async () => {
      const user: JwtPayload = {
        sub: 'tech-1',
        email: 'tech1@fleetcore.com',
        role: UserRole.TECHNICIAN,
        name: 'Tech 1',
      };
      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.IN_PROGRESS,
      };

      mockMaintenancesService.findOne.mockResolvedValue(mockMaintenance);
      mockMaintenancesService.updateStatus.mockResolvedValue({
        ...mockMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
      });

      const result = await controller.updateStatus('maint-1', dto, user);

      expect(service.updateStatus).toHaveBeenCalledWith('maint-1', dto, user.role);
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('should throw ForbiddenException if TECHNICIAN tries to update unassigned maintenance', async () => {
      const user: JwtPayload = {
        sub: 'tech-2',
        email: 'other_tech@fleetcore.com',
        role: UserRole.TECHNICIAN,
        name: 'Tech 2',
      };
      const dto: UpdateMaintenanceStatusDto = {
        status: MaintenanceStatus.IN_PROGRESS,
      };

      mockMaintenancesService.findOne.mockResolvedValue(mockMaintenance);

      await expect(controller.updateStatus('maint-1', dto, user)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.updateStatus).not.toHaveBeenCalled();
    });
  });
});
