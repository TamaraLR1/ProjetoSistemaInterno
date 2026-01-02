import { Request, Response } from 'express';
import pool from '../database';
import fs from 'fs';
import path from 'path';
import { devLog, errorLog } from '../utils/log.util'; 

// Interface estendida para suportar autenticação e arquivos do Multer
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
                fs.unlinkSync(file.path); 
            }
        });
        devLog(`Limpeza: ${files.length} arquivos removidos do servidor.`);
    }
};

// =======================================================
// 1. Criar Produto
// =======================================================
export const createProduct = async (req: AuthRequest, res: Response) => {
    const { name, description, price } = req.body;
    const userId = req.userId; 
    const files = req.files as Express.Multer.File[] | undefined;

    if (!userId) {
        cleanupFiles(files);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!name || !price) {
        cleanupFiles(files);
        return res.status(400).json({ message: 'Nome e Preço são obrigatórios.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Note: usei p.name/p.description conforme sua tabela original 'products'
        const [result]: any = await connection.execute(
            'INSERT INTO products (name, description, price, user_id) VALUES (?, ?, ?, ?)',
            [name, description, price, userId]
        );

        const newProductId = result.insertId;

        if (files && files.length > 0) {
            const imageInserts = files.map(file => {
                // O middleware já gera o nome único no filename
                const image_url = file.filename; 
                
                return connection.execute(
                    'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                    [newProductId, image_url]
                );
            });
            await Promise.all(imageInserts);
        }

        await connection.commit();

        return res.status(201).json({ 
            message: 'Produto cadastrado com sucesso!', 
            productId: newProductId 
        });

    } catch (error) {
        await connection.rollback();
        cleanupFiles(files); 
        errorLog('Erro ao criar produto', error);
        return res.status(500).json({ message: 'Erro interno ao cadastrar produto.' });
    } finally {
        connection.release();
    }
};

// =======================================================
// 2. Listar Produtos (Para o Catálogo)
// =======================================================
export const listProducts = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                p.id, p.name, p.description, p.price, p.user_id,
                GROUP_CONCAT(pi.image_url) AS all_images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            GROUP BY p.id
            ORDER BY p.id DESC
        `;

        const [rows]: any = await pool.execute(query);

        const products = rows.map((product: any) => {
            const images = product.all_images ? product.all_images.split(',') : [];
            return {
                ...product,
                image_url: images[0] || '', 
                all_images: images          
            };
        });

        res.json(products);
    } catch (error) {
        errorLog('Erro ao listar produtos', error);
        res.status(500).json({ message: 'Erro ao buscar produtos.' });
    }
};

// =======================================================
// 3. Detalhes do Produto
// =======================================================
export const getProductDetails = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const productID = parseInt(id);

    if (isNaN(productID)) return res.status(400).json({ message: 'ID inválido.' });
    
    try {
        const [rows]: any = await pool.execute(
            `SELECT p.*, u.firstName, u.lastName 
             FROM products p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [productID]
        );

        if (rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });

        const [imageRows]: any = await pool.execute(
            'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id ASC',
            [productID]
        );

        return res.status(200).json({
            ...rows[0],
            image_urls: imageRows.map((row: any) => row.image_url),
        });

    } catch (error) {
        errorLog(`Erro nos detalhes do produto ${productID}`, error);
        return res.status(500).json({ message: 'Erro ao buscar detalhes.' });
    }
};

// =======================================================
// 4. Atualizar Produto (Com novas imagens)
// =======================================================
export const updateProductWithImages = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const { name, description, price } = req.body; 
    const userId = req.userId;
    const productID = parseInt(id);
    const newFiles = req.files as Express.Multer.File[] | undefined; 

    if (!userId || isNaN(productID)) {
        cleanupFiles(newFiles);
        return res.status(400).json({ message: 'Dados inválidos.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verificar propriedade
        const [existing]: any = await connection.execute('SELECT user_id FROM products WHERE id = ?', [productID]);
        if (existing.length === 0) {
            cleanupFiles(newFiles);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Atualizar textos
        await connection.execute(
            'UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?',
            [name, description, price, productID]
        );

        // Se enviou novas imagens, substitui as antigas
        if (newFiles && newFiles.length > 0) {
            const [oldImages]: any = await connection.execute('SELECT image_url FROM product_images WHERE product_id = ?', [productID]);

            // Deletar arquivos físicos antigos
            oldImages.forEach((img: any) => {
                const fullPath = path.join(__dirname, '../../uploads', img.image_url);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });

            await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productID]);

            const inserts = newFiles.map(file => 
                connection.execute('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productID, file.filename])
            );
            await Promise.all(inserts);
        }

        await connection.commit();
        return res.status(200).json({ message: 'Produto atualizado!' });

    } catch (error) {
        await connection.rollback();
        cleanupFiles(newFiles); 
        errorLog('Erro na atualização', error);
        return res.status(500).json({ message: 'Erro ao atualizar.' });
    } finally {
        connection.release();
    }
};

// =======================================================
// 5. Deletar Produto
// =======================================================
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const productID = parseInt(id);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [images]: any = await connection.execute('SELECT image_url FROM product_images WHERE product_id = ?', [productID]);

        // Remover arquivos físicos
        images.forEach((img: any) => {
            const fullPath = path.join(__dirname, '../../uploads', img.image_url);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });

        await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productID]);
        await connection.execute('DELETE FROM products WHERE id = ?', [productID]);

        await connection.commit();
        return res.status(200).json({ message: 'Deletado com sucesso.' });
    } catch (error) {
        await connection.rollback();
        errorLog('Erro ao deletar', error);
        return res.status(500).json({ message: 'Erro ao excluir.' });
    } finally {
        connection.release();
    }
};