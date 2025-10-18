// auth.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Login para usar cookie HttpOnly
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0]; 

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '1h', 
        });

        // [ALTERADO] Enviar o token como um cookie SEGURO
        res.cookie('authToken', token, {
            httpOnly: true, // Impede acesso via JavaScript (XSS)
            secure: process.env.NODE_ENV === 'production', // Só envia em HTTPS em produção
            sameSite: 'strict', // Protege contra CSRF
            maxAge: 3600000 // 1 hora
        });

        res.json({ message: 'Login bem-sucedido' });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

// NOVO: Função de Logout para limpar o cookie
export const logoutUser = (req: Request, res: Response) => {
    // Limpar o cookie, forçando a expiração
    res.cookie('authToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0) 
    });
    res.status(200).json({ message: 'Logout bem-sucedido' });
};