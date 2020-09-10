import Redis from "ioredis";

interface IUser {
  id: number;
  getId(): number;
  getName(): string;
  getAge(): number;
  generateUserId(): number;
  toObject(user?: string): IUser;
  toJSON(): string;
}

class User implements IUser {
  readonly id: number;
  constructor(private readonly name: string, private readonly age: number) {
    this.id = this.generateUserId();
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getAge() {
    return this.age;
  }

  generateUserId() {
    return Math.random() * 19838940000;
  }

  toObject(user?: string | null) {
    if (user) {
      return JSON.parse(user);
    }
    return {
      id: this.id,
      name: this.name,
      age: this.age,
    };
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }
}

interface CacheMapper {
  find(cacheKey: string): Promise<string | null>;
}

abstract class DataMapper implements CacheMapper {
  protected readonly _cacheConnection: Redis.Redis;
  constructor() {
    this._cacheConnection = new Redis();
  }

  async find(cacheKey: string): Promise<string | null> {
    const dataResult = await this._cacheConnection.get(cacheKey);

    if (!dataResult) {
      return null;
    }

    return dataResult;
  }
}

class UserMapper extends DataMapper {}

class AddUserMapper extends DataMapper {
  async insert(user: User): Promise<void> {
    await this._cacheConnection.set(user.getId().toString(), user.toJSON());
  }
}

interface IListUser {
  find(id: number): Promise<string | null>;
}
class ListUserUseCase implements IListUser {
  constructor(private readonly userMapper: UserMapper) {}

  async find(id: number): Promise<string | null> {
    const user = await this.userMapper.find(id.toString());

    if (!user) {
      console.error("User not exists");
      return null;
    }
    return user;
  }
}

interface IAddUser {
  insert(user: User): Promise<void>;
}
class AddUserUseCase implements IAddUser {
  constructor(private readonly addUserMapper: AddUserMapper) {}

  async insert(user: User): Promise<void> {
    await this.addUserMapper.insert(user);
  }
}

const add = new AddUserUseCase(new AddUserMapper());
const list = new ListUserUseCase(new UserMapper());

(async () => {
  const user = new User("Fernando", 36);
  await add.insert(user);
  const userRestored = await list.find(user.id);
  console.log(user.toObject(userRestored));
})();
