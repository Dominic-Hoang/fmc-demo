import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DistributedLockService {
  constructor(private redis: Redis) {}

  async acquireOrExtendLock(
    key: string,
    value: string,
    ttlSecs: number,
  ): Promise<'OK' | null> {
    try {
      const result = await this.redis.eval(
        `
          if redis.call("exists", KEYS[1]) == 0 then
            redis.call("set", KEYS[1], ARGV[1], "EX", ARGV[2])
            return "OK"
          elseif redis.call("get", KEYS[1]) == ARGV[1] then
            redis.call("expire", KEYS[1], ARGV[2])
            return "OK"
          else
            return "FAILED"
          end
        `,
        1,
        key,
        value,
        ttlSecs,
      );
      if (result === 'OK') return 'OK';
      else return null;
    } catch (err) {
      console.error('Error acquiring/extending lock:', err);
      return null;
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
