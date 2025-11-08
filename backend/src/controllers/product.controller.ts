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
// Caminho: src/controllers/product.controller.ts

// ... (imports e interfaces inalterados) ...

// =======================================================
// CORRIGIDO: Função para Listar Todos os Produtos
// =======================================================
export const listProducts = async (req: Request, res: Response) => {
    try {
        // Query para selecionar todos os produtos E o nome do criador
        const [rows]: any = await pool.execute(
            `SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price,
                u.firstName,                             -- <--- Nome do Vendedor
                pi.image_url                             -- <--- Primeira URL de Imagem
             FROM products p
             JOIN users u ON p.user_id = u.id           -- <--- JOIN com a tabela de usuários
             LEFT JOIN product_images pi ON p.id = pi.product_id
             GROUP BY p.id, p.name, p.description, p.price, u.firstName, pi.image_url
             ORDER BY p.id DESC`
        );

        // O mapeamento abaixo garante que o campo 'image_url' seja o primeiro encontrado
        const products = rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            sellerName: row.firstName, // Incluir o nome do vendedor
            image_url: row.image_url // Apenas a primeira imagem para a listagem
        }));

        return res.status(200).json(products);

    } catch (error) {
        errorLog('Erro ao listar produtos', error);
        return res.status(500).json({ message: 'Erro no servidor ao listar produtos.' });
    }
};


// =======================================================
// 3. GET PRODUCT DETAILS (CORRIGIDO: Utiliza AuthRequest)
// =======================================================
export const getProductDetails = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId; // ID do usuário logado (pode ser undefined se a rota for pública)
    const productID = parseInt(id);

    if (isNaN(productID)) {
        return res.status(400).json({ message: 'ID de produto inválido.' });
    }
    
    // NOTA: A rota deve ser protegida (com 'protect') para que req.userId seja preenchido e a checagem isOwner funcione.

    try {
        // 1. Busca os detalhes do produto e o nome COMPLETO do vendedor
        const [rows]: any = await pool.execute(
            `SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price, 
                p.user_id,             
                u.firstName,           
                u.lastName             
             FROM products p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [productID]
        );

        const productDetails = rows[0];

        if (!productDetails) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        // 2. Busca todas as imagens associadas
        const [imageRows]: any = await pool.execute(
            'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id ASC',
            [productID]
        );

        const imageUrls = imageRows.map((row: any) => row.image_url);

        // 3. CALCULA A FLAG DE PROPRIEDADE
        // Compara o user_id do produto com o userId do usuário logado
        const isOwner = productDetails.user_id === userId; 
        
        // 4. Retorna a resposta completa
        return res.status(200).json({
            id: productDetails.id,
            name: productDetails.name,
            description: productDetails.description,
            price: productDetails.price,
            firstName: productDetails.firstName,
            lastName: productDetails.lastName,
            image_urls: imageUrls,
            isOwner: isOwner 
        });

    } catch (error) {
        errorLog(`Erro ao buscar detalhes do produto ID ${productID}`, error);
        return res.status(500).json({ message: 'Erro no servidor ao buscar detalhes.' });
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

// ... (imports e interfaces no topo do arquivo) ...

// =======================================================
// NOVO: Função para Deletar Produto

// ... (imports: Request, Response, pool, fs, devLog, errorLog e interface AuthRequest inalterados) ...

// =======================================================
// CORRIGIDO: Função para Deletar Produto
// =======================================================
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const userId = req.userId; // ID do usuário logado
    const productID = parseInt(id);

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (isNaN(productID)) {
         return res.status(400).json({ message: 'ID de produto inválido.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Validação de Propriedade
        const [productRows]: any = await connection.execute(
            'SELECT user_id FROM products WHERE id = ?', 
            [productID]
        );
        
        const product = productRows[0];
        
        if (!product) {
            await connection.rollback();
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        if (product.user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ message: 'Acesso negado. Você só pode deletar seus próprios produtos.' });
        }
        
        // 3. Busca os caminhos dos arquivos na tabela de IMAGENS
        // O USUÁRIO CORRIGIU AQUI, USANDO image_url
        const [imageRows]: any = await connection.execute(
            'SELECT image_url FROM product_images WHERE product_id = ?', 
            [productID]
        );
        
        // 4. Excluir Imagens do Sistema de Arquivos (FS)
        if (imageRows.length > 0) {
            // CORREÇÃO: Usar a propriedade 'image_url' no objeto
            imageRows.forEach((image: { image_url: string }) => { 
                // Acesso corrigido: image.image_url
                const fullPath = `./uploads/${image.image_url.trim()}`;
                
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    devLog(`Arquivo deletado: ${fullPath}`);
                } else {
                    devLog(`Caminho não encontrado para exclusão: ${fullPath}.`);
                }
            });
        }
        
        // 5. Excluir Registros de Imagem no Banco de Dados
        await connection.execute(
            'DELETE FROM product_images WHERE product_id = ?', 
            [productID]
        );
        
        // 6. Excluir o Registro Principal do Produto
        await connection.execute(
            'DELETE FROM products WHERE id = ?', 
            [productID]
        );
        
        await connection.commit();

        return res.status(200).json({ message: 'Produto deletado com sucesso, incluindo todas as imagens.' });

    } catch (error) {
        await connection.rollback();
        // Garante que o log de erro use o ID correto
        errorLog(`Erro ao deletar produto ID ${productID}`, error);
        return res.status(500).json({ message: 'Erro no servidor ao deletar produto.' });
    } finally {
        connection.release();
    }
};
// ... (restante do arquivo inalterado) ...