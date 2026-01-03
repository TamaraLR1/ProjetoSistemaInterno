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
    
    // O parseUpload coloca os arquivos em req.files como um array.
    // Pegamos a primeira posição (index 0) como o nosso novo avatar.
    const files = req.files as Express.Multer.File[] | undefined;
    const avatarFile = files && files.length > 0 ? files[0] : null;

    try {
        // 1. Verificação de dados básicos
        if (!firstName || !lastName) {
            // Se o upload salvou um arquivo mas os dados estão incompletos, limpamos o arquivo
            if (avatarFile) fs.unlinkSync(avatarFile.path);
            return res.status(400).json({ message: 'Nome e sobrenome são obrigatórios.' });
        }

        // 2. SE o usuário enviou uma imagem nova, precisamos apagar a antiga
        if (avatarFile) {
            // Busca o nome do arquivo atual no banco de dados
            const [rows]: any = await pool.execute(
                'SELECT avatar_url FROM users WHERE id = ?',
                [userId]
            );

            const oldAvatar = rows[0]?.avatar_url;

            // Se existir uma imagem antiga cadastrada, apaga o arquivo físico
            if (oldAvatar) {
                // path.join garante que funcione em Windows e Linux
                const filePath = path.join(__dirname, '../../uploads', oldAvatar);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Deleta o arquivo antigo
                    console.log(`Arquivo antigo deletado: ${oldAvatar}`);
                }
            }
        }

        // 3. Atualiza os dados no banco de dados
        let sql = 'UPDATE users SET firstName = ?, lastName = ?';
        const params: any[] = [firstName.trim(), lastName.trim()];

        if (avatarFile) {
            sql += ', avatar_url = ?';
            // Salvamos apenas o filename (ex: 17041234.jfif) conforme o padrão do middleware
            params.push(avatarFile.filename);
        }

        sql += ' WHERE id = ?';
        params.push(userId);

        await pool.execute(sql, params);

        res.json({ 
            message: 'Perfil atualizado com sucesso!',
            // Retornamos o novo nome para o frontend atualizar a imagem na tela
            newAvatarUrl: avatarFile ? avatarFile.filename : null 
        });

    } catch (error) {
        // Se der erro no banco, mas o arquivo foi salvo no HD, tentamos limpar
        if (avatarFile && fs.existsSync(avatarFile.path)) {
            fs.unlinkSync(avatarFile.path);
        }
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
};