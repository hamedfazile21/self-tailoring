import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private allowFields = {
    id: true,
    email: true,
    name: true,
    last_name: true,
    created_at: true,
    updated_at: true,
  };

  private hashPassword(password: string) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...rest } = this.userRepository.create(createUserDto);
      const row = await this.userRepository.save({
        ...rest,
        password: this.hashPassword(password),
      });

      return rest;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: 'duplicate-entry',
          data: ['Email Already Taken !'],
        });
      }
    }
  }

  async findAll(page = 1, limit = 10, search = '') {
    const currentPage =
      Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 10;
    const normalizedSearch = search.trim();
    const where = normalizedSearch
      ? [
          { name: Like(`%${normalizedSearch}%`) },
          { email: Like(`%${normalizedSearch}%`) },
        ]
      : undefined;
    const [data, total] = await this.userRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: this.allowFields,
    });
    return {
      data,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: this.allowFields,
    });
    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'not-found',
        data: ['User Not Found'],
      });
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'not-found',
        data: ['User Not Found'],
      });
    }
    try {
      if (updateUserDto.password) {
        const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
        user.password = hashedPassword;
      }

      if (updateUserDto.name) {
        user.name = updateUserDto.name;
      }

      if (updateUserDto.email) {
        user.email = updateUserDto.email;
      }

      return await this.userRepository.save(user);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: 'duplicate-entry',
          data: ['Email Already Taken !'],
        });
      }
    }
  }

  async remove(ids: number[]) {
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
      throw new BadRequestException(
        'A non-empty array of valid user ids is required',
      );
    }

    const deleteResult = await this.userRepository.delete(ids);
    if (deleteResult.affected === 0) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'not-found',
        data: ['Users Not Found'],
      });
    }
    return {
      message: 'Users deleted successfully',
      affected: deleteResult.affected ?? 0,
    };
  }

  async findOneByEmail(email: string) {
    const currentUser = await this.userRepository.findOneBy({ email });
    return currentUser;
  }
}
