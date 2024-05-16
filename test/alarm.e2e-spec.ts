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
  });
});
