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
    // O userId vem do token JWT processado pelo middleware 'protect'
    const userId = req.userId;

    try {
        // 1. Fazemos a busca garantindo que o email e avatar_url estejam no SELECT
        const [rows]: any = await pool.execute(
            'SELECT id, firstName, lastName, email, avatar_url FROM users WHERE id = ?',
            [userId]
        );

        // 2. Verifica se o usuário existe
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = rows[0];

        // 3. Retorna os dados para o frontend
        // O objeto 'user' conterá: user.firstName, user.lastName, user.email e user.avatar_url
        res.json({ 
            success: true,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        res.status(500).json({ message: 'Erro interno ao buscar dados do perfil.' });
    }
};

export const updateUserInfo = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { firstName, lastName } = req.body;
    const avatarFile = req.file; // Pegamos o arquivo processado pelo Multer

    if (!firstName || firstName.trim() === '' || !lastName || lastName.trim() === '') {
        return res.status(400).json({ message: 'Nome e Sobrenome são obrigatórios.' });
    }

    try {
        let sql = 'UPDATE users SET firstName = ?, lastName = ?';
        const params: any[] = [firstName.trim(), lastName.trim()];

        // Se o usuário enviou uma foto nova, atualizamos a coluna avatar_url
        if (avatarFile) {
            sql += ', avatar_url = ?';
            params.push(avatarFile.filename);
        }

        sql += ' WHERE id = ?';
        params.push(userId);

        const [result]: any = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
};