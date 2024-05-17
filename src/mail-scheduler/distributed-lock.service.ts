import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DistributedLockService {
  constructor(private redis: Redis) {}

  async acquireLock(
    key: string,
    value: string,
    ttlSecs: number,
  ): Promise<'OK' | null> {
    try {
      const result = await this.redis.call(
        'SET',
        key,
        value,
        'NX',
        'EX',
        ttlSecs,
      );
      if (result === 'OK') return 'OK';
      else return null;
    } catch (err) {
      console.error('Error acquiring lock:', err);
      return null;
    }
  }

  async extendLock(
    key: string,
    value: string,
    ttlSecs: number,
  ): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    try {
      const result = await this.redis.eval(script, 1, key, value, ttlSecs);
      return result === 1;
    } catch (err) {
      console.error('Error extending lock TTL:', err);
      return false;
    }
  }

  async releaseLock(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.redis.eval(
        `if redis.call('get', KEYS[1]) == ARGV[1] then 
            return redis.call('del', KEYS[1]) 
        else 
            return 0 
        end`,
        1,
        key,
        value,
      );
      return result === 1;
    } catch (err) {
      console.error('Error releasing  lock:', err);
      return false;
    }
  }
}
