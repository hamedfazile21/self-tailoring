import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
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
    email: true,
    id: true,
    name: true,
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

      return row;
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

  async findAll() {
    return await this.userRepository.find({
      select: this.allowFields,
    });
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

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user)
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: 'not-found',
        data: ['User Not Found'],
      });
    try {
      await this.userRepository.delete(id);
      return ['user deleted successfully'];
    } catch (error) {
      throw new InternalServerErrorException('server side error');
    }
  }
}
