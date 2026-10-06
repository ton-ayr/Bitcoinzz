// Acrescenta o `userId` ao Request do Express. Ele é preenchido pelo middleware `authenticate`.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
