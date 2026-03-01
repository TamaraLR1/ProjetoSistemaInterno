import { Request, Response } from 'express';
import pool from '../database';

// 1. Criar Categoria
export const createCategory = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nome é obrigatório" });

    // Gerar slug simples: "Eletrônicos e Casa" -> "eletronicos-e-casa"
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    try {
        await pool.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
        res.status(201).json({ message: "Categoria criada com sucesso!" });
    } catch (error: any) {
        res.status(400).json({ message: "Erro: Categoria já existe ou dados inválidos." });
    }
};

// 2. Pegar Todas
export const getCategories = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar categorias." });
    }
};

// 3. Pegar por ID
export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [rows]: any = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Categoria não encontrada" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar categoria." });
    }
};

// 4. Editar Categoria
export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    try {
        const [result]: any = await pool.execute(
            'UPDATE categories SET name = ?, slug = ? WHERE id = ?', 
            [name, slug, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoria não encontrada" });
        res.json({ message: "Categoria atualizada com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar categoria." });
    }
};

// 5. Excluir Categoria
export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result]: any = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Categoria não encontrada" });
        res.json({ message: "Categoria excluída com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro: Verifique se existem produtos vinculados a esta categoria antes de excluir." });
    }
};