// src/controllers/product.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import fs from 'fs';
import { devLog, errorLog } from '../utils/log.util'; // Importa as novas funções de log

// Interface para garantir que req.userId e req.file estejam presentes
interface AuthRequest extends Request {
    userId?: number; 
    file?: Express.Multer.File; 
}

export const createProduct = async (req: AuthRequest, res: Response) => {
    const { name, description, price } = req.body;
    const userId = req.userId;
    const file = req.file; 
    
    // Log de desenvolvimento: Início da requisição (Só aparece em ambiente 'development')
    devLog('--- Recebendo Novo Cadastro de Produto ---');
    devLog(`UserID (Autenticado): ${userId || 'Não Autenticado'}`);
    devLog('Dados do Body:', { 
        name, 
        price, 
        description: description ? description.substring(0, 50) + '...' : 'N/A' // Truncado para o log
    });
    devLog('Arquivo:', file ? file.path : 'N/A');

    // 1. Validação de Autenticação
    if (!userId) {
        // Limpa o arquivo antes de retornar o erro
        if (file && file.path) { fs.unlinkSync(file.path); }
        errorLog('Tentativa de cadastro de produto sem autenticação.', { name, price });
        return res.status(401).json({ message: 'Usuário não autenticado. Faça login.' });
    }

    // 2. Validação de Campos Obrigatórios
    if (!name || !price) {
        if (file && file.path) { fs.unlinkSync(file.path); }
        errorLog('Campos obrigatórios ausentes no cadastro de produto.', { userId, name, price });
        return res.status(400).json({ message: 'Nome e Preço são obrigatórios.' });
    }

    // 3. Preparação do URL da Imagem
    let image_url: string | null = null;
    if (file) {
        image_url = file.path; 
    }

    // 4. Inserção no Banco de Dados
    try {
        await pool.execute(
            `INSERT INTO products (user_id, name, description, price, image_url) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId, 
                name, 
                description || null, 
                parseFloat(price), 
                image_url
            ]
        );

        // Log de desenvolvimento: Sucesso
        devLog(`PRODUTO CADASTRADO: Produto '${name}' (ID Usuário: ${userId})`);
        
        return res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
        
    } catch (error) {
        // Log de erro: Falha na Query DB (SEMPRE USAR errorLog aqui)
        errorLog('Falha grave ao inserir produto no DB. Limpando arquivo...', error);

        // Limpa o arquivo se o DB falhou
        if (file && file.path) { 
            fs.unlinkSync(file.path); 
            devLog(`Arquivo de upload excluído devido a erro de DB: ${file.path}`);
        }
        
        return res.status(500).json({ message: 'Erro interno ao cadastrar produto.' });
    }
};