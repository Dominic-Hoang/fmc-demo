import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { DistributedLockService } from '../src/mail-scheduler/distributed-lock.service';

describe('MailSchedulerService', () => {
  let distributedLockService: DistributedLockService;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    distributedLockService = app.get<DistributedLockService>(
      DistributedLockService,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  const randomProcessObtainLock = async (lockKey: string) => {
    return await distributedLockService.acquireOrExtendLock(
      lockKey,
      randomUUID(),
      2,
    );
  };

  it('Just 1 process obtain lock while 1000 processes try to access at the same time', async () => {
    const LOCK_KEY = 'test:distributedLock:first';
    const simulateTasks: Promise<'OK' | null>[] = new Array(1000)
      .fill(0)
      .map(() => randomProcessObtainLock(LOCK_KEY));
    const results = await Promise.all(simulateTasks);
    let countOkResult = 0;
    results.forEach((result) => {
      if (result === 'OK') {
        countOkResult++;
      }
    });

    expect(countOkResult).toEqual(1);
  });

  it('The process holding lock able to extend lock TTL', async () => {
    const LOCK_KEY = 'test:distributedLock:second';
    const lockHolderValue = randomUUID();
    const ttlSec = 2;
    const idleTimeSec = 1;
    // a process obtain the lock
    const firstObtain = await distributedLockService.acquireOrExtendLock(
      LOCK_KEY,
      lockHolderValue,
      ttlSec,
    );
    expect(firstObtain).toEqual('OK');

    // time passed
    await new Promise((r) => setTimeout(r, idleTimeSec * 1000));

    // other processes obtain the lock should fail
    expect(
      await Promise.all(
        new Array(10).fill(0).map(() => randomProcessObtainLock(LOCK_KEY)),
      ),
    ).toEqual(new Array(10).fill(null));

    // here, the beginning process, again, obtain the lock to extend the TTL
    const secondObtain = await distributedLockService.acquireOrExtendLock(
      LOCK_KEY,
      lockHolderValue,
      ttlSec,
    );
    expect(secondObtain).toEqual('OK');

    // some time passed
    await new Promise((r) => setTimeout(r, idleTimeSec * 1000));

    // other processes obtain the lock should still fail
    expect(
      await Promise.all(
        new Array(10).fill(0).map(() => randomProcessObtainLock(LOCK_KEY)),
      ),
    ).toEqual(new Array(10).fill(null));
  });
});
