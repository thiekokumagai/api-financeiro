import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { IUsersRepository } from '../repositories/iusers.repository';
import { UpdatePasswordUseCase } from './update-password.use-case';

function setup() {
  const user = {
    id: 'u1',
    password: bcrypt.hashSync('senha-atual', 4),
    refreshToken: 'sessao-a,sessao-b',
  };
  const repo = {
    findById: jest.fn().mockResolvedValue(user),
    update: jest.fn().mockResolvedValue(user),
  };
  return {
    repo,
    useCase: new UpdatePasswordUseCase(repo as unknown as IUsersRepository),
  };
}

describe('UpdatePasswordUseCase: M3, troca de senha revoga as sessões', () => {
  it('grava a senha nova e refreshToken: null (derruba todas as sessões)', async () => {
    const { repo, useCase } = setup();

    await useCase.execute('u1', {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova-123',
    } as never);

    const [id, data] = repo.update.mock.calls[0] as [
      string,
      { password: string; refreshToken: null },
    ];
    expect(id).toBe('u1');
    expect(data.refreshToken).toBeNull();
    expect('refreshToken' in data).toBe(true);
    expect(await bcrypt.compare('senha-nova-123', data.password)).toBe(true);
  });

  it('senha atual errada: nada é gravado e as sessões continuam', async () => {
    const { repo, useCase } = setup();

    await expect(
      useCase.execute('u1', {
        currentPassword: 'errada',
        newPassword: 'senha-nova-123',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
