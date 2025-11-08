// Caminho: src/controllers/product.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import fs from 'fs';
import path from 'path'; 
import { devLog, errorLog } from '../utils/log.util'; 

// =======================================================
// INTERFACE DE TIPAGEM (CRUCIAL)
// Garante que req.userId exista após o middleware 'protect'
// =======================================================
interface AuthRequest extends Request {
    userId?: number; 
    file?: Express.Multer.File;          
    files?: Express.Multer.File[];       
}

// =======================================================
// Função Auxiliar de Limpeza
// =======================================================
const cleanupFiles = (files?: Express.Multer.File[]) => {
    if (files && files.length > 0) {
        files.forEach(file => {
            if (file.path && fs.existsSync(file.path)) { 
                try {
                    fs.unlinkSync(file.path); 
                    devLog(`Arquivo de upload excluído: ${file.filename}`);
                } catch (err) {
                    errorLog(`Falha ao excluir arquivo de upload ${file.filename}`, err);
                }
            }
        });
        devLog(`Total de ${files.length} arquivos de upload excluídos.`);
    }
};

// =======================================================
// 1. CREATE PRODUCT (Utiliza AuthRequest)
// =======================================================
export const createProduct = async (req: AuthRequest, res: Response) => {
    // ... (Lógica inalterada, usa req.userId) ...
    const files = req.files as Express.Multer.File[] || []; 
    const { name, description, price } = req.body;
    const userId = req.userId;

    if (!userId) {
        cleanupFiles(files); 
        return res.status(401).json({ message: 'Não autenticado.' });
    }
    // ... (Restante da lógica de criação) ...
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result]: any = await connection.execute(
            'INSERT INTO products (user_id, name, description, price) VALUES (?, ?, ?, ?)',
            [userId, name, description, price]
        );

        const productId = result.insertId;

        if (files.length > 0) {
            const imageValues = files.map(file => [productId, file.path]);
            
            await connection.query(
                'INSERT INTO product_images (product_id, image_url) VALUES ?',
                [imageValues]
            );
        }

        await connection.commit();
        return res.status(201).json({ message: 'Produto cadastrado com sucesso!', productId });

    } catch (error) {
        errorLog('Erro no cadastro do produto:', error);
        if (connection) {
            await connection.rollback();
        }
        cleanupFiles(files); 
        return res.status(500).json({ message: 'Erro no servidor ao cadastrar o produto.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =======================================================
// 2. LIST PRODUCTS (Utiliza Request simples)
// =======================================================
export const listProducts = async (req: Request, res: Response) => {
    // ... (Lógica inalterada, não precisa de req.userId) ...
    try {
        const [rows]: any = await pool.execute(
            `SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price,
                MAX(pi.image_url) AS image_url, 
                u.firstName AS userFirstName
             FROM products p
             LEFT JOIN product_images pi ON p.id = pi.product_id
             JOIN users u ON p.user_id = u.id 
             GROUP BY p.id
             ORDER BY p.created_at DESC`
        );

        return res.status(200).json(rows);

    } catch (error) {
        errorLog('Erro ao listar produtos:', error);
        return res.status(500).json({ message: 'Erro no servidor ao carregar produtos.' });
    }
};

// =======================================================
// 3. GET PRODUCT DETAILS (CORRIGIDO: Utiliza AuthRequest)
// =======================================================
export const getProductDetails = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const productId = parseInt(id as string, 10);
    // userId é necessário para a flag isOwner no frontend
    const userId = req.userId; 

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'ID de produto inválido.' });
    }

    try {
        // 1. Buscar detalhes do produto e o nome do usuário
        const [productRows]: any = await pool.execute(
            `SELECT p.id, p.user_id, p.name, p.description, p.price, u.firstName 
             FROM products p
             JOIN users u ON p.user_id = u.id 
             WHERE p.id = ?`, 
            [productId]
        );
        
        const product = productRows[0];
        
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // 2. Buscar todas as URLs de imagem associadas
        const [imageRows]: any = await pool.execute(
            'SELECT image_url FROM product_images WHERE product_id = ?',
            [productId]
        );

        const image_urls = imageRows.map((row: { image_url: string }) => row.image_url);

        // 3. Montar o objeto de resposta
        const responseData = {
            ...product,
            image_urls: image_urls,
            // A comparação com userId é crucial e agora é possível
            isOwner: product.user_id === userId, 
        };

        return res.status(200).json(responseData);

    } catch (error) {
        errorLog(`Erro ao buscar detalhes do produto ID ${productId}:`, error);
        return res.status(500).json({ message: 'Erro no servidor ao carregar os detalhes do produto.' });
    }
};

// =======================================================
// 4. UPDATE PRODUCT (CORRIGIDO: Utiliza AuthRequest)
// =======================================================
export const updateProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const { name, description, price } = req.body; 
    // userId é necessário para a verificação de permissão
    const userId = req.userId;
    
    if (!name || !price) {
        return res.status(400).json({ message: 'Nome e Preço são obrigatórios.' });
    }

    // Verificação de segurança: O userId DEVE estar presente
    if (!userId) {
        return res.status(401).json({ message: 'Não autenticado.' });
    }

    try {
        // 1. Validação de propriedade (o usuário logado é o dono do produto?)
        const [existingRows]: any = await pool.execute(
            'SELECT user_id FROM products WHERE id = ?', 
            [id]
        );
        
        const existingProduct = existingRows[0];
        
        if (!existingProduct) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // 2. Verificação de permissão
        if (existingProduct.user_id !== userId) {
            return res.status(403).json({ message: 'Acesso negado. Você só pode editar seus próprios produtos.' });
        }
        
        // 3. Se for o dono, faz o update
        await pool.execute(
            'UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?',
            [name, description, price, id]
        );
        
        return res.status(200).json({ message: 'Produto atualizado com sucesso.' });
        
    } catch (error) {
        errorLog(`Erro ao atualizar produto ID ${id}:`, error);
        return res.status(500).json({ message: 'Erro no servidor ao tentar atualizar o produto.' });
    }
};

// Exportações estão corretas (usando 'export const')