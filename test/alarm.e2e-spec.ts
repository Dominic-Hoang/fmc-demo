import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fail } from 'assert';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AlarmEntity } from '../src/alarms/entities/alarm.entity';
import { RecipientEntity } from '../src/alarms/entities/recipient.entity';
import { SubscriptionEntity } from '../src/alarms/entities/subscription.entity';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/users/entities/user.entity';

describe('Alarm API', () => {
  let app: INestApplication;
  let datasource: DataSource;
  let userToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Clear database data
    datasource = app.get<DataSource>(DataSource);
    const userRepo = datasource.getRepository(UserEntity);
    userRepo.delete({});

    // signUp 2 separate users
    await request(app.getHttpServer()).post('/auth/basic/signUp').send({
      name: 'johnathan',
      password: 'somedummysecret',
      displayName: 'John',
    });

    await request(app.getHttpServer()).post('/auth/basic/signUp').send({
      name: 'maria',
      password: 'somedummysecret',
      displayName: 'Maria',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // delete all alarm data
    const alarmRepo = datasource.getRepository(AlarmEntity);
    const subscriptionRepo = datasource.getRepository(SubscriptionEntity);
    const recipientRepo = datasource.getRepository(RecipientEntity);
    await alarmRepo.delete({});
    await subscriptionRepo.delete({});
    await recipientRepo.delete({});
  });

  beforeEach(async () => {
    // signIn 2 users
    const signInResponse1 = await request(app.getHttpServer())
      .post('/auth/basic/signIn')
      .send({
        name: 'johnathan',
        password: 'somedummysecret',
      });
    userToken = signInResponse1.body['access_token'] ?? fail();

    const signInResponse2 = await request(app.getHttpServer())
      .post('/auth/basic/signIn')
      .send({
        name: 'maria',
        password: 'somedummysecret',
      });
    otherUserToken = signInResponse2.body['access_token'] ?? fail();
  });

  it('Anonymous user have no right', async () => {
    const listAlarmResponse = await request(app.getHttpServer()).get(`/alarms`);
    expect(listAlarmResponse.statusCode).toEqual(HttpStatus.UNAUTHORIZED);

    const createAlarmResponse = await request(app.getHttpServer()).post(
      `/alarms`,
    );
    expect(createAlarmResponse.statusCode).toEqual(HttpStatus.UNAUTHORIZED);

    const getAlarmResponse = await request(app.getHttpServer()).get(
      `/alarms/1`,
    );
    expect(getAlarmResponse.statusCode).toEqual(HttpStatus.UNAUTHORIZED);

    const updateAlarmResponse = await request(app.getHttpServer()).patch(
      `/alarms/1`,
    );
    expect(updateAlarmResponse.statusCode).toEqual(HttpStatus.UNAUTHORIZED);

    const deleteAlarmResponse = await request(app.getHttpServer()).delete(
      `/alarms/1`,
    );
    expect(deleteAlarmResponse.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
  });

  describe('User logged in', () => {
    let dummyAlarm1Id: string;
    const dummyAlarm1 = {
      cron: '* * * * *',
      subject: 'Hello friends',
      message: 'Its me, Dominic',
    };
    const dummyAlarm2 = {
      cron: '* * * * *',
      subject: 'Global Fashion',
      message: 'The leading fashion and lifestyle destination',
    };

    beforeEach(async () => {
      // user 1 create 2 dummy alarms
      const createAlarmResponse1 = await request(app.getHttpServer())
        .post('/alarms')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dummyAlarm1);
      expect(createAlarmResponse1.statusCode).toEqual(HttpStatus.CREATED);
      dummyAlarm1Id = createAlarmResponse1.body['id'];

      const createAlarmResponse2 = await request(app.getHttpServer())
        .post('/alarms')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dummyAlarm2);
      expect(createAlarmResponse2.statusCode).toEqual(HttpStatus.CREATED);
    });

    it('List dummy alarms successfully', async () => {
      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.OK);
      expect(getAlarmResponse.body.length).toEqual(2);
    });

    it('Get dummy alarm successfully', async () => {
      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.OK);
      expect(getAlarmResponse.body['id']).toBeDefined();
      expect(getAlarmResponse.body['cron']).toEqual(dummyAlarm1['cron']);
      expect(getAlarmResponse.body['subject']).toEqual(dummyAlarm1['subject']);
      expect(getAlarmResponse.body['message']).toEqual(dummyAlarm1['message']);
    });

    it('Get non-existing alarm return not found', async () => {
      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/999999`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });

    it('Other users have no idea of current user alarm existence', async () => {
      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });

    it('Delete dummy alarm successfully', async () => {
      const deleteAlarmResponse = await request(app.getHttpServer())
        .delete(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(deleteAlarmResponse.statusCode).toEqual(HttpStatus.OK);

      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });

    it('Other users cannot delete dummy alarm', async () => {
      const deleteAlarmResponse = await request(app.getHttpServer())
        .delete(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(deleteAlarmResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);

      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.OK);
    });

    it('Other users cannot update dummy alarm', async () => {
      const updateDummyAlarmReq = {
        subject: 'Good morning',
      };
      const updateAlarmsResponse = await request(app.getHttpServer())
        .patch(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateDummyAlarmReq);

      expect(updateAlarmsResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);

      const getAlarmResponse = await request(app.getHttpServer())
        .get(`/alarms/${dummyAlarm1Id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getAlarmResponse.statusCode).toEqual(HttpStatus.OK);
      expect(getAlarmResponse.body['subject']).toEqual(dummyAlarm1['subject']);
    });

    it('Users cannot see alarms created by others while listing', async () => {
      const listAlarmsResponse = await request(app.getHttpServer())
        .get('/alarms')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(listAlarmsResponse.statusCode).toEqual(HttpStatus.OK);
      expect(listAlarmsResponse.body.length).toEqual(0);
    });

    describe('Manage recipient', () => {
      let recipient1Id: string;

      const recipient1 = {
        emailAddress: 'egzod@gmail.com',
      };
      const recipient2 = {
        emailAddress: 'red.bull@outlook.com',
      };

      beforeEach(async () => {
        const createRecipient1Response = await request(app.getHttpServer())
          .post(`/alarms/${dummyAlarm1Id}/recipients`)
          .send(recipient1)
          .set('Authorization', `Bearer ${userToken}`);
        expect(createRecipient1Response.statusCode).toEqual(HttpStatus.CREATED);

        recipient1Id = createRecipient1Response.body['id'];

        const createRecipient2Response = await request(app.getHttpServer())
          .post(`/alarms/${dummyAlarm1Id}/recipients`)
          .send(recipient2)
          .set('Authorization', `Bearer ${userToken}`);
        expect(createRecipient2Response.statusCode).toEqual(HttpStatus.CREATED);
      });

      it('Users list recipients successfully', async () => {
        const listRecipientResponse = await request(app.getHttpServer())
          .get(`/alarms/${dummyAlarm1Id}/recipients`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(listRecipientResponse.statusCode).toEqual(HttpStatus.OK);
        expect(listRecipientResponse.body.length).toEqual(2);
        listRecipientResponse.body.forEach((recipient: any) => {
          expect(recipient['id']).toBeDefined();
        });
        const listRecipients = listRecipientResponse.body.map(
          (recipient: any) => recipient['emailAddress'],
        );
        expect(listRecipients.sort()).toEqual(
          [recipient1.emailAddress, recipient2.emailAddress].sort(),
        );
      });

      it('Add same email twice wont take effect', async () => {
        const createRecipientResponse = await request(app.getHttpServer())
          .post(`/alarms/${dummyAlarm1Id}/recipients`)
          .send(recipient1)
          .set('Authorization', `Bearer ${userToken}`);
        expect(createRecipientResponse.statusCode).toEqual(HttpStatus.CREATED);

        const listRecipientResponse = await request(app.getHttpServer())
          .get(`/alarms/${dummyAlarm1Id}/recipients`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(listRecipientResponse.statusCode).toEqual(HttpStatus.OK);
        expect(listRecipientResponse.body.length).toEqual(2);
        listRecipientResponse.body.forEach((recipient: any) => {
          expect(recipient['id']).toBeDefined();
        });
        const listRecipients = listRecipientResponse.body.map(
          (recipient: any) => recipient['emailAddress'],
        );
        expect(listRecipients.sort()).toEqual(
          [recipient1.emailAddress, recipient2.emailAddress].sort(),
        );
      });

      it('Other users have no idea current user recipients', async () => {
        const listRecipientResponse = await request(app.getHttpServer())
          .get(`/alarms/${dummyAlarm1Id}/recipients`)
          .set('Authorization', `Bearer ${otherUserToken}`);
        expect(listRecipientResponse.statusCode).toEqual(HttpStatus.NOT_FOUND);
      });
      describe('Recipient interaction ***implementation details***', () => {
        let deactivateCode: string;

        beforeEach(async () => {
          const sub = await datasource
            .getRepository(SubscriptionEntity)
            .findOneBy({ recipientId: recipient1Id });
          deactivateCode = sub?.deactivateCode ?? '';
        });

        it('Recipient unsubscribe successfully', async () => {
          const unsubscribeResponse = await request(app.getHttpServer())
            .get(`/alarms/@unsubscribe`)
            .query({ deactivateCode });
          expect(unsubscribeResponse.statusCode).toEqual(HttpStatus.OK);

          const listRecipientResponse = await request(app.getHttpServer())
            .get(`/alarms/${dummyAlarm1Id}/recipients`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(listRecipientResponse.body.length).toEqual(1);
        });

        it('Recipient resubscribe successfully', async () => {
          const unsubscribeResponse = await request(app.getHttpServer())
            .get(`/alarms/@unsubscribe`)
            .query({ deactivateCode });
          expect(unsubscribeResponse.statusCode).toEqual(HttpStatus.OK);

          const resubscribeResponse = await request(app.getHttpServer())
            .get(`/alarms/@resubscribe`)
            .query({ deactivateCode });
          expect(resubscribeResponse.statusCode).toEqual(HttpStatus.OK);

          const listRecipientResponse = await request(app.getHttpServer())
            .get(`/alarms/${dummyAlarm1Id}/recipients`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(listRecipientResponse.body.length).toEqual(2);
        });
      });
    });
  });
});
