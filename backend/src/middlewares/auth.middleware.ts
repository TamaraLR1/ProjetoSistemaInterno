// auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendendo a interface Request do Express para adicionar 'userId'
interface AuthRequest extends Request {
    userId?: number;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    // O token é lido do cookie 'authToken'
    const token = req.cookies.authToken; 

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não encontrado.' });
    }

    try {
        // Verifica e decodifica o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };

        // Adiciona o ID do usuário à requisição
        req.userId = decoded.id; 

        // Continua para o controller
        next();
        
    } catch (error) {
        console.error('Erro na autenticação do token:', error);
        return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
};