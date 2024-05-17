import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bull';
import { CronJob, CronTime } from 'cron';
import { randomUUID } from 'crypto';
import { AlarmService } from '../alarms/alarms.service';
import { DistributedLockService } from './distributed-lock.service';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('sendingEmails') private sendingEmailsQueue: Queue,
    private alarmService: AlarmService,
    private schedulerRegistry: SchedulerRegistry,
    private distributedLockService: DistributedLockService,
  ) {}

  private static readonly DISTRIBUTED_CRON_LOCK_KEY = 'alarmLeader:lock';
  private static readonly DISTRIBUTED_CRON_LOCK_EXPIRE_SECS = 10;

  private static readonly SCHEDULER_ID = randomUUID();

  private alarmCronJobName = (id: string) => `alarm.${id}`;
  private decodeCronJobName = (name: string) => name.slice(6);

  @Interval(5000)
  async schedule() {
    const lockResult = await this.distributedLockService.acquireOrExtendLock(
      SchedulerService.DISTRIBUTED_CRON_LOCK_KEY,
      SchedulerService.SCHEDULER_ID,
      SchedulerService.DISTRIBUTED_CRON_LOCK_EXPIRE_SECS,
    );
    if (lockResult === 'OK') {
      await this.registerAllCronJobs();
    } else {
      this.unregisterAllCronJobs();
    }
  }

  async registerAllCronJobs() {
    const alarms = await this.alarmService.getAlarms();
    const registry = this.schedulerRegistry;
    const alarmIds = alarms.map((alarm) => alarm.id);

    const currentCronJobs = registry.getCronJobs();

    for (const [name, job] of currentCronJobs.entries()) {
      const id = this.decodeCronJobName(name);
      if (!alarmIds.includes(id)) {
        job.stop();
        registry.deleteCronJob(name);
      }
    }

    alarms.forEach((alarm) => {
      const id = alarm.id;
      const name = this.alarmCronJobName(id);
      const cron = alarm.cron;

      const currentJob = currentCronJobs.get(name);

      if (!currentJob) {
        try {
          const job = new CronJob(
            cron,
            async () => {
              try {
                await this.sendingEmailsQueue.add({ alarmId: id });
              } catch (error) {
                console.error(`Cannot sent alarm ${id} to the queue`, error);
              }
            },
            null,
            true,
            'utc',
          );
          registry.addCronJob(name, job);
          job.start();
        } catch (error) {
          console.error(`Failed to register cron ${cron} for ${id}`, error);
        }
      } else {
        try {
          if (currentJob.cronTime.source !== cron) {
            currentJob.setTime(new CronTime(cron, 'utc'));
          }
        } catch (error) {
          console.error(`Failed to update time ${cron} for ${id}`, error);
        }
      }
    });
  }

  private unregisterAllCronJobs() {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    cronJobs.forEach((job, name) => {
      job.stop();
      this.schedulerRegistry.deleteCronJob(name);
    });
  }
}
