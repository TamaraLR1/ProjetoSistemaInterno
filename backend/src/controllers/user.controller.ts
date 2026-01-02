// user.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import bcrypt from 'bcryptjs';
import fs from 'fs'; // Importante para deletar arquivos
import path from 'path';

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
    const avatarFile = req.file;

    try {
        // 1. SE o usuário enviou uma imagem nova, precisamos apagar a antiga
        if (avatarFile) {
            // Busca o nome do arquivo atual no banco de dados
            const [rows]: any = await pool.execute(
                'SELECT avatar_url FROM users WHERE id = ?',
                [userId]
            );

            const oldAvatar = rows[0]?.avatar_url;

            // Se existir uma imagem antiga cadastrada, apaga o arquivo físico
            if (oldAvatar) {
                const filePath = path.join(__dirname, '../../uploads', oldAvatar);
                
                // Verifica se o arquivo realmente existe na pasta antes de tentar apagar
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Deleta o arquivo
                    console.log(`Arquivo antigo deletado: ${oldAvatar}`);
                }
            }
        }

        // 2. Atualiza os dados no banco de dados
        let sql = 'UPDATE users SET firstName = ?, lastName = ?';
        const params: any[] = [firstName.trim(), lastName.trim()];

        if (avatarFile) {
            sql += ', avatar_url = ?';
            params.push(avatarFile.filename);
        }

        sql += ' WHERE id = ?';
        params.push(userId);

        const [result]: any = await pool.execute(sql, params);

        res.json({ 
            message: 'Perfil atualizado com sucesso!',
            // Retornamos o novo nome para o frontend se necessário
            newAvatarUrl: avatarFile ? avatarFile.filename : null 
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
};