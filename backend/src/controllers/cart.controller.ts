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

        // 1. Busca a quantidade de PRODUTOS DIFERENTES no carrinho
        // Mudamos SUM(quantity) para COUNT(*)
        const [cartRows]: any = await pool.execute(
            'SELECT COUNT(*) as total FROM cart_items WHERE user_id = ?',
            [userId]
        );

        // 2. Busca Usuário adaptado à sua tabela (Mantido igual)
        const [userRows]: any = await pool.execute(
            `SELECT 
                id, 
                CONCAT(firstName, ' ', lastName) AS name, 
                avatar_url AS avatar,
                'client' AS role 
             FROM users WHERE id = ?`,
            [userId]
        );

        // O total agora reflete o número de itens distintos
        const totalCount = cartRows[0].total || 0;
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


// 1. LISTAR ITENS (Com Join para pegar Nome, Preço e Imagem)
export const getCartItems = async (req: any, res: Response) => {
    // Usando req.userId ou req.user.id conforme sua configuração de middleware
    const userId = req.userId || (req.user ? req.user.id : null);

    try {
        const query = `
            SELECT 
                ci.product_id AS productId, 
                ci.quantity, 
                p.name, 
                p.price,
                -- Busca a imagem principal para exibir no carrinho
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) AS main_image
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        `;

        const [items]: any = await pool.execute(query, [userId]);
        
        // Retorna o array de itens para o frontend
        return res.json(items);

    } catch (error: any) {
        console.error('ERRO NO SQL DO CARRINHO:', error.message);
        return res.status(500).json({ 
            message: "Erro ao buscar carrinho.",
            details: error.message 
        });
    }
};

// 2. ATUALIZAR QUANTIDADE
export const updateCartItem = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    try {
        // Mudança de 'cart' para 'cart_items'
        await pool.execute(
            'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );
        return res.json({ message: "Quantidade atualizada." });
    } catch (error: any) {
        console.error("Erro ao atualizar quantidade:", error.message);
        return res.status(500).json({ message: "Erro ao atualizar no banco." });
    }
};

// 3. REMOVER ITEM
export const removeCartItem = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { productId } = req.params;

    try {
        // Mudança de 'cart' para 'cart_items'
        await pool.execute(
            'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return res.json({ message: "Item removido com sucesso." });
    } catch (error: any) {
        console.error("Erro ao remover item:", error.message);
        return res.status(500).json({ message: "Erro ao remover do banco." });
    }
};