import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createOne(entity: UserEntity) {
    return await this.userRepository.save(entity);
  }

  async findOneById(id: string) {
    return await this.userRepository.findOneBy({ id });
  }

  async findOneByName(name: string) {
    return await this.userRepository.findOneBy({ name });
  }

  async findAll() {
    return await this.userRepository.find();
  }
}
