import type { Request, Response } from 'express';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

/** Só traduz HTTP ↔ service. O body já chega validado pelo middleware `validate`. */
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register = async (req: Request<unknown, unknown, RegisterInput>, res: Response) => {
    const user = await this.auth.register(req.body);
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  };

  login = async (req: Request<unknown, unknown, LoginInput>, res: Response) => {
    const result = await this.auth.login(req.body);
    res.status(200).json(result);
  };
}
