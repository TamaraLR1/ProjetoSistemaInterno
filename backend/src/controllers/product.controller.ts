// Caminho: src/controllers/product.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import fs from 'fs';
import { devLog, errorLog } from '../utils/log.util'; 

// Estende a Request para incluir o ID do usuário e o arquivo de upload
interface AuthRequest extends Request {
    userId?: number; 
    file?: Express.Multer.File; 
}

// =======================================================
// FUNÇÕES EXISTENTES
// =======================================================

export const createProduct = async (req: AuthRequest, res: Response) => {
    const { name, description, price } = req.body;
    const userId = req.userId;
    const file = req.file; 
    
    devLog('--- Recebendo Novo Cadastro de Produto ---');
    devLog(`UserID (Autenticado): ${userId || 'Não Autenticado'}`);

    if (!userId) {
        if (file && file.path) { fs.unlinkSync(file.path); }
        errorLog('Tentativa de criação sem autenticação.', null);
        return res.status(401).json({ message: 'Ação não autorizada. Faça login.' });
    }
    if (!name || !price) {
        if (file && file.path) { fs.unlinkSync(file.path); }
        return res.status(400).json({ message: 'Nome e Preço são obrigatórios.' });
    }

    try {
        const imagePath = file ? file.path.replace(/\\/g, '/') : '';
        
        await pool.execute(
            'INSERT INTO products (user_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)',
            [userId, name, description, price, imagePath]
        );

        devLog(`PRODUTO CADASTRADO: Produto '${name}' (ID Usuário: ${userId})`);
        
        return res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
        
    } catch (error) {
        errorLog('Falha grave ao inserir produto no DB. Limpando arquivo...', error);

        if (file && file.path) { 
            fs.unlinkSync(file.path); 
            devLog(`Arquivo de upload excluído devido a erro de DB: ${file.path}`);
        }
        
        return res.status(500).json({ message: 'Erro interno ao cadastrar produto.' });
    }
};

export const listProducts = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.execute(
            'SELECT id, name, description, price, image_url, created_at, user_id FROM products ORDER BY created_at DESC'
        );
        
        devLog(`Listando ${rows.length} produtos.`);

        return res.status(200).json(rows);
        
    } catch (error) {
        errorLog('Erro ao listar produtos:', error);
        return res.status(500).json({ message: 'Erro interno ao carregar produtos.' });
    }
};


// =======================================================
// 🌟 NOVAS FUNÇÕES PARA EDIÇÃO 🌟
// =======================================================

// 1. Função para buscar detalhes de um único produto por ID
export const getProductDetails = async (req: Request, res: Response) => {
    const { id } = req.params; 
    
    if (!id) {
        return res.status(400).json({ message: 'ID do produto é obrigatório.' });
    }

    try {
        const [rows]: any = await pool.execute(
            'SELECT id, name, description, price, image_url, user_id FROM products WHERE id = ?', 
            [id]
        );
        
        const product = rows[0];

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        devLog(`Detalhes do Produto ID ${id} encontrados.`);
        
        return res.status(200).json(product);
        
    } catch (error) {
        errorLog(`Falha ao buscar detalhes do produto ID ${id}:`, error);
        return res.status(500).json({ message: 'Erro interno ao buscar produto.' });
    }
};

// 2. Função para atualizar um produto
export const updateProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const { name, description, price } = req.body;
    const userId = req.userId;
    const newFile = req.file; 
    
    devLog('--- Recebendo Atualização de Produto ---');
    devLog(`Produto ID: ${id}`);

    // 1. Validação de Autenticação e ID
    if (!userId) {
        if (newFile && newFile.path) { fs.unlinkSync(newFile.path); }
        return res.status(401).json({ message: 'Ação não autorizada. Faça login.' });
    }
    if (!id || !name || !price) {
        if (newFile && newFile.path) { fs.unlinkSync(newFile.path); }
        return res.status(400).json({ message: 'ID, Nome e Preço são obrigatórios.' });
    }
    
    try {
        // 2. Buscar dados atuais (para verificar o proprietário e a imagem antiga)
        const [existingRows]: any = await pool.execute(
            'SELECT user_id, image_url FROM products WHERE id = ?', 
            [id]
        );
        
        const existingProduct = existingRows[0];
        
        if (!existingProduct) {
            if (newFile && newFile.path) { fs.unlinkSync(newFile.path); }
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // 3. Verificação de Propriedade (Opcional, mas Altamente Recomendado)
        if (existingProduct.user_id !== userId) {
            if (newFile && newFile.path) { fs.unlinkSync(newFile.path); }
            errorLog(`Usuário ${userId} tentou editar produto de outro usuário (${existingProduct.user_id}).`, null);
            return res.status(403).json({ message: 'Você não tem permissão para editar este produto.' });
        }
        
        let imagePath = existingProduct.image_url;
        
        // 4. Se houver um novo arquivo, atualiza o caminho e deleta o antigo
        if (newFile) {
            // Define o novo caminho para o banco de dados
            imagePath = newFile.path.replace(/\\/g, '/'); 
            
            // Deleta o arquivo antigo
            const oldImagePath = existingProduct.image_url; 
            
            if (oldImagePath && fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                devLog(`Imagem antiga excluída: ${oldImagePath}`);
            }
        }

        // 5. Executar a Atualização no Banco de Dados
        const [result]: any = await pool.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
            [name, description, price, imagePath, id]
        );

        if (result.affectedRows === 0) {
            if (newFile && newFile.path) { fs.unlinkSync(newFile.path); }
            return res.status(500).json({ message: 'Falha ao atualizar o produto.' });
        }

        devLog(`PRODUTO ATUALIZADO: Produto ID ${id} por Usuário ${userId}`);
        
        return res.status(200).json({ message: 'Produto atualizado com sucesso!' });
        
    } catch (error) {
        errorLog(`Falha grave ao atualizar produto ID ${id}:`, error);
        
        if (newFile && newFile.path) { 
            fs.unlinkSync(newFile.path); 
        }
        
        return res.status(500).json({ message: 'Erro interno ao atualizar produto.' });
    }
};