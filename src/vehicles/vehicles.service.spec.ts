import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service.js';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity.js';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto.js';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let mockVehicleRepo: any;

  const mockVehicle: Vehicle = {
    id: 'veh-123',
    plate: 'ABC-123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2022,
    mileage: 15000,
    status: VehicleStatus.AVAILABLE,
    maintenances: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockVehicleRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepo,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a vehicle if plate is not registered', async () => {
      const dto: CreateVehicleDto = {
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        mileage: 15000,
      };

      mockVehicleRepo.findOne.mockResolvedValue(null);
      mockVehicleRepo.create.mockReturnValue(mockVehicle);
      mockVehicleRepo.save.mockResolvedValue(mockVehicle);

      const result = await service.create(dto);

      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith({
        where: { plate: dto.plate },
      });
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(dto);
      expect(mockVehicleRepo.save).toHaveBeenCalledWith(mockVehicle);
      expect(result).toEqual(mockVehicle);
    });

    it('should throw ConflictException if plate already exists', async () => {
      const dto: CreateVehicleDto = {
        plate: 'ABC-123',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        mileage: 15000,
      };

      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockVehicleRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all vehicles ordered by createdAt DESC', async () => {
      mockVehicleRepo.find.mockResolvedValue([mockVehicle]);

      const result = await service.findAll();

      expect(mockVehicleRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockVehicle]);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne('veh-123');

      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'veh-123' },
      });
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPlate', () => {
    it('should return a vehicle by plate', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findByPlate('ABC-123');

      expect(mockVehicleRepo.findOne).toHaveBeenCalledWith({
        where: { plate: 'ABC-123' },
      });
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException if vehicle by plate does not exist', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(service.findByPlate('XYZ-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update vehicle successfully', async () => {
      const dto: UpdateVehicleDto = { mileage: 20000 };
      mockVehicleRepo.findOne.mockResolvedValue({ ...mockVehicle });
      mockVehicleRepo.save.mockImplementation((v: any) => Promise.resolve(v));

      const result = await service.update('veh-123', dto);

      expect(result.mileage).toBe(20000);
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new plate already exists', async () => {
      const dto: UpdateVehicleDto = { plate: 'NEW-999' };
      mockVehicleRepo.findOne
        .mockResolvedValueOnce({ ...mockVehicle }) // findOne by id
        .mockResolvedValueOnce({ id: 'veh-other', plate: 'NEW-999' }); // plate check

      await expect(service.update('veh-123', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deactivate', () => {
    it('should set status to INACTIVE and save', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({ ...mockVehicle });
      mockVehicleRepo.save.mockImplementation((v: any) => Promise.resolve(v));

      const result = await service.deactivate('veh-123');

      expect(result.status).toBe(VehicleStatus.INACTIVE);
      expect(mockVehicleRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should call repo update with status', async () => {
      await service.updateStatus('veh-123', VehicleStatus.IN_MAINTENANCE);

      expect(mockVehicleRepo.update).toHaveBeenCalledWith('veh-123', {
        status: VehicleStatus.IN_MAINTENANCE,
      });
    });
  });
});

