import { Request, Response } from 'express';
import pool from '../database';

interface AuthRequest extends Request {
    userId?: number;     
}

export const addToCart = async (req: AuthRequest, res: Response) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.userId; 

        console.log("Tentando adicionar:", { userId, productId }); // Log no terminal do VS Code

        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }

        const [existing]: any = await pool.execute(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existing.length > 0) {
            await pool.execute(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity || 1, existing[0].id]
            );
        } else {
            await pool.execute(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, productId, quantity || 1]
            );
        }

        res.status(200).json({ message: "Sucesso!" });
    } catch (error: any) {
        console.error("ERRO NO BANCO:", error); // Isso vai te mostrar se a tabela falta ou coluna está errada
        res.status(500).json({ error: error.message });
    }
};

export const getCartCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId; 
        
        if (!userId) {
            return res.status(401).json({ count: 0, user: null });
        }

        // 1. Busca total do carrinho
        const [cartRows]: any = await pool.execute(
            'SELECT IFNULL(SUM(quantity), 0) as total FROM cart_items WHERE user_id = ?',
            [userId]
        );

        // 2. Busca Usuário adaptado à sua tabela
        // Usamos CONCAT para unir firstName e lastName como 'name'
        // Usamos avatar_url AS avatar para o frontend reconhecer
        const [userRows]: any = await pool.execute(
            `SELECT 
                id, 
                CONCAT(firstName, ' ', lastName) AS name, 
                avatar_url AS avatar,
                'client' AS role 
             FROM users WHERE id = ?`,
            [userId]
        );

        const totalCount = cartRows[0].total;
        const userData = userRows.length > 0 ? userRows[0] : null;

        return res.json({ 
            count: totalCount,
            user: userData 
        });

    } catch (error: any) {
        console.error('ERRO NO SQL:', error.message);
        return res.status(500).json({ error: "Erro interno no servidor" });
    }
};