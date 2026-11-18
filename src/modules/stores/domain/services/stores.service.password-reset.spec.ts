import { StoresService } from './stores.service';
import { PrismaService } from '../../../../../prisma/prisma.service';

function setup() {
  const prisma = {
    store: {
      findUnique: jest.fn().mockResolvedValue({
        id: 's1',
        subdomain: 'loja',
        adminEmail: 'admin@loja.com',
      }),
      update: jest.fn().mockResolvedValue({ id: 's1' }),
    },
    storeSettings: { updateMany: jest.fn() },
    user: {
      findFirst: jest.fn().mockResolvedValue({ id: 'admin1' }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  return {
    prisma,
    service: new StoresService(prisma as unknown as PrismaService),
  };
}

describe('StoresService.updateStore: M3, redefinir a senha do admin da loja revoga as sessões', () => {
  it('com senha nova grava refreshToken: null no admin', async () => {
    const { prisma, service } = setup();

    await service.updateStore('s1', { password: 'nova-senha-123' });

    const [arg] = prisma.user.update.mock.calls[0] as [
      { where: { id: string }; data: { refreshToken: null; password: string } },
    ];
    expect(arg.where.id).toBe('admin1');
    expect(arg.data.refreshToken).toBeNull();
    expect('refreshToken' in arg.data).toBe(true);
    expect(arg.data.password).toBeTruthy();
  });

  it('sem senha (só título) NÃO mexe nas sessões', async () => {
    const { prisma, service } = setup();

    await service.updateStore('s1', { title: 'Novo nome' });

    const [arg] = prisma.user.update.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect('refreshToken' in arg.data).toBe(false);
    expect('password' in arg.data).toBe(false);
  });
});
