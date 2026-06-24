import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { getRepositoryToken } from '@nestjs/typeorm'; // 1. Import this
import { Customer } from './entities/customer.entity'; // 2. Import your Customer Entity

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    // 3. Create a mock object with the methods your service calls (like find, save, etc.)
    const mockCustomerRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          // 4. Tell NestJS to swap the real repository with your mock
          provide: getRepositoryToken(Customer), 
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});