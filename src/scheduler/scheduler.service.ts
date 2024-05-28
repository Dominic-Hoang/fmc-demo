import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('sendingEmails') private sendingEmailsQueue: Queue,
  ) {}

  private alarmCronJobName = (id: string) => `alarm.${id}`;

  async addCronJob(alarmId: string, cron: string) {
    try {
      await this.sendingEmailsQueue.add(
        { alarmId },
        {
          jobId: this.alarmCronJobName(alarmId),
          repeat: { cron },
        },
      );
    } catch (error) {
      console.error(`Cannot sent alarm ${alarmId} to the queue`, error);
    }
  }

  async removeCronJob(alarmId: string, cron: string) {
    try {
      await this.sendingEmailsQueue.removeRepeatable({
        jobId: this.alarmCronJobName(alarmId),
        cron,
      });
    } catch (error) {
      console.error(`Cannot remove alarm ${alarmId} from the queue`, error);
    }
  }
}
