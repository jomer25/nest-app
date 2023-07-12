import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userSchema: Model<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userSchema.create(createUserDto);
    return user;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = 'all users';
    let users: User[] = await this.cacheManager.get(cacheKey);

    if(!users) {
      users = await this.userSchema.find().exec()
      await this.cacheManager.set(cacheKey, users);
    }

    return users;
  }

  async findOne(id: string): Promise<User> {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    };

    const cacheKey = `user_${id}`;

    let user: User = await this.cacheManager.get(cacheKey);

    if(!user) {
      user = await this.userSchema.findOne({ _id: id }).exec();
      
      if(!user) {
        throw new NotFoundException('User not found');
      }

      await this.cacheManager.set(cacheKey, user);
    };
    console.log(cacheKey);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    };

    const cacheKey = `user_${id}`;

    const user = await this.userSchema.findOneAndUpdate({ _id: id }, updateUserDto).exec();
    
    if(!user) {
      throw new NotFoundException('User not found');
    };

    await this.cacheManager.set(cacheKey, user)

    return user;
  }

  async remove(id: string): Promise<void> {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    };

    const cacheKey = `user_${id}`;

    const user = await this.userSchema.findOneAndDelete({ _id: id }).exec();
    
    if(!user) {
      throw new NotFoundException('User not found');
    };

    await this.cacheManager.del(cacheKey);
  };
}
