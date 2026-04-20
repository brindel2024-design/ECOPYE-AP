import type { FastifyPluginAsync } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  otpRequestSchema,
  otpVerifySchema,
  changePinSchema,
} from '@ecopye/types';
import {
  registerUser,
  loginUser,
  refreshSession,
  requestOtp,
  verifyOtp,
  changePin,
  logout,
} from '@ecopye/auth-service';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/register', async (req) => {
    const dto = registerSchema.parse(req.body);
    return registerUser(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
  });

  app.post(
    '/login',
    {
      config: { rateLimit: { max: 10, timeWindow: 60_000 } },
    },
    async (req) => {
      const dto = loginSchema.parse(req.body);
      return loginUser(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
    },
  );

  app.post('/refresh', async (req) => {
    const dto = refreshSchema.parse(req.body);
    return refreshSession(dto);
  });

  app.post('/logout', { preHandler: app.authenticate }, async (req) => {
    await logout(req.user!.sub);
    return { success: true };
  });

  app.post('/otp/request', {
    config: { rateLimit: { max: 3, timeWindow: 60_000 } },
  }, async (req) => {
    const dto = otpRequestSchema.parse(req.body);
    return requestOtp(dto);
  });

  app.post('/otp/verify', async (req) => {
    const dto = otpVerifySchema.parse(req.body);
    return verifyOtp(dto);
  });

  app.post('/pin', { preHandler: app.authenticate }, async (req) => {
    const dto = changePinSchema.parse(req.body);
    await changePin(req.user!.sub, dto);
    return { success: true };
  });

  app.get('/me', { preHandler: app.authenticate }, async (req) => {
    return { user: req.user };
  });
};
