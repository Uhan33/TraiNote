import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('health 는 ok', () => {
    expect(new AppController().health()).toEqual({ status: 'ok' });
  });
});
