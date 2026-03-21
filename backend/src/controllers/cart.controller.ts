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
        // Verifica se o middleware injetou o usuário
        const userId = req.userId; 
        
        if (!userId) {
            return res.status(401).json({ count: 0, message: "Usuário não identificado" });
        }

        const [rows]: any = await pool.execute(
            'SELECT SUM(quantity) as total FROM cart_items WHERE user_id = ?',
            [userId]
        );

        // Retorna 0 se o resultado for null (carrinho vazio)
        const totalCount = rows[0]?.total ? parseInt(rows[0].total) : 0;
        
        return res.json({ count: totalCount });
    } catch (error: any) {
        console.error('ERRO NO COUNT DO CARRINHO:', error.message);
        // Retorna 500 mas com uma mensagem para você debugar no terminal
        return res.status(500).json({ count: 0, error: error.message });
    }
};