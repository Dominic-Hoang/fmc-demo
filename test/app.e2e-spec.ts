import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { OAuth2Client } from 'google-auth-library';
import { DataSource } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    const datasource = app.get<DataSource>(DataSource);
    const entities = datasource.entityMetadatas;

    for (const entity of entities) {
      const repository = datasource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  });

  it('Google return correct redirect response', async () => {
    const response = await request(app.getHttpServer()).get(
      '/auth/oauth2/google/url',
    );

    expect(response.statusCode).toEqual(HttpStatus.TEMPORARY_REDIRECT);

    const redirectUrl = response.headers['location'];
    const parsedUrl = new URL(redirectUrl);
    const searchParams = parsedUrl.searchParams;

    expect(searchParams.has('client_id')).toBe(true);
    expect(searchParams.has('redirect_uri')).toBe(true);
    expect(searchParams.get('response_type')).toEqual('code');
    expect(parsedUrl.host).toMatch(/google.com$/);
  });

  it('Get correct token by Google sign in', async () => {
    const googleOauth2Provider = await app.resolve<OAuth2Client>(OAuth2Client);
    const tokenSpy = jest.fn((code) => {
      if (code === 'dummy code') {
        return {
          tokens: {
            id_token:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmV4YW1wbGUuY29tIiwiYXpwIjoiMzgzMjA1Mzg5MDE3LTBrOWRjZDBqdDdub24xdGQ2Z3B0MS5jb20iLCJhdWQiOiIzODMyMDUzODkwMTctMGs5ZGNkMGp0N25vbjF0ZC5jb20iLCJzdWIiOiIxMDU1MzE5NjIxMzQzMTk0MTI0NzciLCJlbWFpbCI6ImRvbWluaWMuaG9hbmdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiIyMjZwb09DOCIsIm5hbWUiOiJEb21pbmljIEhvYW5nIiwiZ2l2ZW5fbmFtZSI6IkRvbWluaWMiLCJmYW1pbHlfbmFtZSI6IkhvYW5nIiwiaWF0IjoxNjE1NjUwODgyLCJleHAiOjE2MTU2NTQ0ODJ9.UYahAKvFh1HhEGFcU5iWD1--Kpoi9ggbW978_JwkN_M',
          },
        };
      }
      return {};
    });
    jest.spyOn(googleOauth2Provider, 'getToken').mockImplementation(tokenSpy);

    const response = await request(app.getHttpServer())
      .get('/auth/oauth2/google/callback')
      .query({ code: 'dummy code' });

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(Object.keys(response.body).includes('access_token')).toBe(true);
  });

  it('Create new correct user and successfully sign in', async () => {
    const signUpResponse = await request(app.getHttpServer())
      .post('/auth/basic/signUp')
      .send({
        name: 'domhoang',
        password: 'somedummysecret',
        displayName: 'Dominic Hoang',
      });

    expect(signUpResponse.statusCode).toEqual(HttpStatus.CREATED);

    const signInResponse = await request(app.getHttpServer())
      .post('/auth/basic/signIn')
      .send({
        name: 'domhoang',
        password: 'somedummysecret',
      });
    expect(signInResponse.statusCode).toEqual(HttpStatus.OK);
    expect(Object.keys(signInResponse.body).includes('access_token')).toBe(
      true,
    );
  });

  it('Create 2 users with same name should fail', async () => {
    const firstSignUpResponse = await request(app.getHttpServer())
      .post('/auth/basic/signUp')
      .send({
        name: 'domhoang',
        password: 'somedummysecret1',
        displayName: 'Dominic Hoang 1',
      });

    expect(firstSignUpResponse.statusCode).toEqual(HttpStatus.CREATED);

    const secondSignUpResponse = await request(app.getHttpServer())
      .post('/auth/basic/signUp')
      .send({
        name: 'domhoang',
        password: 'somedummysecret2',
        displayName: 'Dominic Hoang 2',
      });

    expect(secondSignUpResponse.statusCode).toEqual(HttpStatus.CONFLICT);
  });
});
