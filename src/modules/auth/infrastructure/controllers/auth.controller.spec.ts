import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../../domain/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../domain/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../domain/use-cases/logout.use-case';

function setup() {
  const logout = { execute: jest.fn().mockResolvedValue(undefined) };
  const controller = new AuthController(
    {} as unknown as LoginUseCase,
    {} as unknown as RefreshTokenUseCase,
    logout as unknown as LogoutUseCase,
  );
  return { controller, logout };
}

describe('AuthController POST /auth/logout', () => {
  it('é protegido pelo guard do REFRESH token (access token não revoga nada) e responde 204', () => {
    // handler lido como objeto (sem referenciar o método solto da classe)
    const handler = (
      AuthController.prototype as unknown as Record<string, object>
    ).logout;
    const guards = Reflect.getMetadata('__guards__', handler) as unknown[];
    expect(guards).toContain(JwtRefreshGuard);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(204);
    expect(Reflect.getMetadata('path', handler)).toBe('logout');
  });

  it('com refresh token válido: revoga só a sessão deste token', async () => {
    const { controller, logout } = setup();

    await expect(
      controller.logout({ sub: 'u1', email: 'a@a.com', refreshToken: 'tok' }),
    ).resolves.toBeUndefined();

    expect(logout.execute).toHaveBeenCalledWith('u1', 'tok');
  });

  it('sem token (ou sem usuário): 401 e nada é revogado', async () => {
    const { controller, logout } = setup();

    await expect(
      controller.logout({ sub: 'u1', email: 'a@a.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.logout(undefined as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(logout.execute).not.toHaveBeenCalled();
  });
});
