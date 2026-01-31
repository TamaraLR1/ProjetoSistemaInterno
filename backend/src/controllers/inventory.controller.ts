import { Request, Response } from 'express';
import pool from '../database';
import { errorLog } from '../utils/log.util';


interface AuthRequest extends Request {
    userId?: number;
    product_id?: number; 
    movement_type?: String;
    quantity?: number;
    reason?: String;
}

export const moveStock = async (req: AuthRequest, res: Response) => {
    const { product_id, movement_type, quantity, reason } = req.body;
    const userId = req.userId;
    const qty = parseInt(quantity);

    // Validações básicas
    if (!product_id || !movement_type || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Dados inválidos para movimentação.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar se o produto pertence ao usuário e pegar o estoque atual
        const [product]: any = await connection.execute(
            'SELECT stock_quantity FROM products WHERE id = ? AND user_id = ?',
            [product_id, userId]
        );

        if (product.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Produto não encontrado ou permissão negada.' });
        }

        const currentStock = product[0].stock_quantity;

        // 2. Se for saída, verificar se há saldo suficiente
        if (movement_type === 'OUT' && currentStock < qty) {
            await connection.rollback();
            return res.status(400).json({ message: `Saldo insuficiente. Estoque atual: ${currentStock}` });
        }

        // 3. Atualizar o saldo na tabela 'products'
        const operator = movement_type === 'IN' ? '+' : '-';
        await connection.execute(
            `UPDATE products SET stock_quantity = stock_quantity ${operator} ? WHERE id = ?`,
            [qty, product_id]
        );

        // 4. Registrar na tabela 'inventory_movements'
        await connection.execute(
            `INSERT INTO inventory_movements (product_id, user_id, quantity, movement_type, reason) 
             VALUES (?, ?, ?, ?, ?)`,
            [product_id, userId, qty, movement_type, reason || 'Movimentação manual']
        );

        await connection.commit();
        return res.status(200).json({ message: 'Movimentação realizada com sucesso!' });

    } catch (error) {
        await connection.rollback();
        errorLog('Erro ao movimentar estoque', error);
        return res.status(500).json({ message: 'Erro interno ao processar estoque.' });
    } finally {
        connection.release();
    }
};

// Listar histórico de movimentações do vendedor
export const getStockHistory = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const query = `
            SELECT m.*, p.name as product_name 
            FROM inventory_movements m
            JOIN products p ON m.product_id = p.id
            WHERE m.user_id = ?
            ORDER BY m.created_at DESC
            LIMIT 50
        `;
        const [rows]: any = await pool.execute(query, [userId]);
        return res.json(rows);
    } catch (error) {
        errorLog('Erro ao buscar histórico de estoque', error);
        return res.status(500).json({ message: 'Erro ao carregar histórico.' });
    }
};