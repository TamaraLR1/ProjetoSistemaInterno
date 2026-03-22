import { Request, Response } from 'express';
import pool from '../database';

export const getPublicProducts = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.price, 
                p.description, 
                p.stock_quantity, 
                CONCAT(u.firstName, ' ', u.lastName) as seller_name,
                -- Pega a primeira imagem como principal
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                -- Pega TODAS as imagens separadas por vírgula para as miniaturas
                (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id) as all_images
            FROM products p
            INNER JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 40
        `;

        const [products]: any = await pool.execute(query);
        
        return res.json(products);
    } catch (error: any) {
        console.error('ERRO NO SQL:', error.message);
        return res.status(500).json({ message: "Erro ao buscar produtos." });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.price, 
                p.description, 
                p.stock_quantity, 
                CONCAT(u.firstName, ' ', u.lastName) as seller_name,
                -- 1. Mantemos a imagem principal para o destaque
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                -- 2. Buscamos TODAS as imagens vinculadas ao produto separadas por vírgula
                (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id) as all_images
            FROM products p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `;
        
        const [rows]: any = await pool.execute(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        // O rows[0] agora conterá o campo 'all_images' que o frontend espera
        return res.json(rows[0]);

    } catch (error: any) {
        console.error('Erro ao buscar produto:', error.message);
        return res.status(500).json({ message: 'Erro ao buscar detalhes do produto.' });
    }
};

// Opcional: Buscar produtos por categoria
export const getProductsByCategory = async (req: Request, res: Response) => {
    // O ID da categoria vem da URL
    const { category } = req.params; 

    try {
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.price, 
                p.description, 
                p.stock_quantity, 
                CONCAT(u.firstName, ' ', u.lastName) as seller_name,
                -- 1. Imagem principal para a vitrine da categoria
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image,
                -- 2. Todas as imagens para manter o padrão do seu novo produto.js
                (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id) as all_images
            FROM products p
            INNER JOIN users u ON p.user_id = u.id
            WHERE p.category_id = ? 
            ORDER BY p.created_at DESC
        `;

        const [products]: any = await pool.execute(query, [category]);
        
        return res.json(products);
    } catch (error: any) {
        console.error('ERRO AO FILTRAR CATEGORIA:', error.message);
        return res.status(500).json({ 
            message: 'Erro ao filtrar produtos por categoria.',
            details: error.message 
        });
    }
};

