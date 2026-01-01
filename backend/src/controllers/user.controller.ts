// user.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
    userId?: number;
}

// Função existente de registro (inalterada)
export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    const [rows]: any = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.execute(
      'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ message: 'Erro no servidor.' });
  }
};

// NOVO: Função para buscar as informações do usuário logado
export const getUserInfo = async (req: AuthRequest, res: Response) => {
    const userId = req.userId; 

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
        // Buscar informações no banco de dados, retornando apenas campos seguros
        const [rows]: any = await pool.execute(
            'SELECT id, firstName, lastName, email FROM users WHERE id = ?', 
            [userId]
        );
        
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ user });
        
    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
};

export const updateUserInfo = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { firstName, lastName, email } = req.body;

    // VALIDAÇÃO NO SERVIDOR
    // Verifica se os campos existem e se não estão preenchidos apenas com espaços
    if (!firstName || firstName.trim() === '' || !lastName || lastName.trim() === '') {
        return res.status(400).json({ 
            message: 'Nome e Sobrenome são obrigatórios e não podem estar vazios.' 
        });
    }

    try {
        const [result]: any = await pool.execute(
            'UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?',
            [firstName.trim(), lastName.trim(), email, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar perfil.' });
    }
};