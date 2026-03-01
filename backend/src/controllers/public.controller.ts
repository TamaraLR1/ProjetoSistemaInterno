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
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image
            FROM products p
            INNER JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 40
        `;

        const [products]: any = await pool.execute(query);
        
        return res.json(products);
    } catch (error: any) {
        console.error('ERRO NO SQL:', error.message);
        return res.status(500).json({ 
            message: "Erro ao buscar produtos no banco de dados.",
            details: error.message 
        });
    }
};

// Opcional: Buscar produtos por categoria
export const getProductsByCategory = async (req: Request, res: Response) => {
    const { category } = req.params;
    try {
        const query = `
            SELECT p.*, u.full_name as seller_name
            FROM products p
            JOIN users u ON p.user_id = u.id
            WHERE p.category = ?
            ORDER BY p.created_at DESC
        `;
        const [products]: any = await pool.execute(query, [category]);
        return res.json(products);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao filtrar categoria.' });
    }
};