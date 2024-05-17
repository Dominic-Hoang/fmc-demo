import { Process, Processor } from '@nestjs/bull';
import { MailService } from './mail.service';
import { Job } from 'bull';
import { AlarmService } from '../alarms/alarms.service';

@Processor('sendingEmails')
export class MailWorkerService {
  constructor(
    private mailService: MailService,
    private alarmService: AlarmService,
  ) {}

  @Process({ concurrency: 1 })
  async processAlarm(job: Job<{ alarmId: string | undefined }>) {
    const alarmId = job.data.alarmId;
    if (alarmId === undefined) return;

    try {
      const alarm = await this.alarmService.getAlarmById(alarmId);

      const subject = alarm.subject;
      const message = alarm.message;

      const tasks = alarm.subscriptions.map((subsciption) => {
        const active = subsciption.active;
        if (!active) return new Promise((r) => r(undefined));
        const emailAddress = subsciption.recipient.emailAddress;
        const deactivateCode = subsciption.deactivateCode;
        return this.mailService.sendMail(
          emailAddress,
          subject,
          `${message}. Deactivate code is ${deactivateCode}`,
        );
      });
      await Promise.all(tasks);
    } catch (error) {
      console.error(`Failed to execute job`, job, 'error', error);
    }
  }
}
