// Caminho: src/controllers/product.controller.ts

import { Request, Response } from 'express';
import pool from '../database';
import fs from 'fs';
import { devLog, errorLog } from '../utils/log.util'; 

// Interface para garantir que req.userId e req.file/files estejam presentes
interface AuthRequest extends Request {
    userId?: number; 
    file?: Express.Multer.File;       
    files?: Express.Multer.File[];       
}

// =======================================================
// Função Auxiliar de Limpeza (mantida)
// =======================================================
const cleanupFiles = (files?: Express.Multer.File[]) => {
    if (files && files.length > 0) {
        files.forEach(file => {
            if (file.path && fs.existsSync(file.path)) { 
                fs.unlinkSync(file.path); 
            }
        });
        devLog(`Total de ${files.length} arquivos de upload excluídos.`);
    }
};

// =======================================================
// 1. Criar Produto (CreateProduct) - (INALTERADA)
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

        const [result]: any = await connection.execute(
            'INSERT INTO products (name, description, price, user_id) VALUES (?, ?, ?, ?)',
            [name, description, price, userId]
        );

        const newProductId = result.insertId;
        const imageUrls: string[] = [];

        if (files && files.length > 0) {
            const imageInserts = files.map(file => {
                const image_url = file.path.replace(/uploads[/\\]/, ''); 
                imageUrls.push(image_url);
                
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
            productId: newProductId,
            imageUrls: imageUrls
        });

    } catch (error) {
        await connection.rollback();
        cleanupFiles(files); 
        errorLog('Erro ao criar produto', error);
        return res.status(500).json({ message: 'Erro no servidor ao cadastrar produto.' });
    } finally {
        connection.release();
    }
};

// =======================================================
// 2. Listar Produtos (ListProducts) - (INALTERADA)
// =======================================================
// Local: src/controllers/product.controller.ts

export const listProducts = async (req: Request, res: Response) => {
    try {
        // Mudamos o SQL para agrupar as imagens
        const [rows]: any = await pool.execute(`
            SELECT 
                p.id, 
                p.name, 
                p.description, 
                p.price, 
                p.user_id,
                GROUP_CONCAT(pi.image_url) as all_images -- Junta as imagens em uma string
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            GROUP BY p.id -- Garante apenas UMA linha por produto
        `);

        // Formata o resultado para que o frontend receba a primeira imagem ou um array
        const products = rows.map((product: any) => {
            const images = product.all_images ? product.all_images.split(',') : [];
            return {
                ...product,
                image_url: images[0] || '', // Usamos a primeira imagem para a listagem
                all_images: images          // Enviamos todas as imagens se precisar
            };
        });

        res.json(products);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos.' });
    }
};

// =======================================================
// 3. Obter Detalhes do Produto (GetProductDetails) - (INALTERADA)
// =======================================================
export const getProductDetails = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId; 
    const productID = parseInt(id);

    if (isNaN(productID)) {
        return res.status(400).json({ message: 'ID de produto inválido.' });
    }
    
    try {
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
        
        const [imageRows]: any = await pool.execute(
            'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id ASC',
            [productID]
        );

        const imageUrls = imageRows.map((row: any) => row.image_url);
        
        return res.status(200).json({
            id: productDetails.id,
            name: productDetails.name,
            description: productDetails.description,
            price: productDetails.price,
            firstName: productDetails.firstName,
            lastName: productDetails.lastName,
            image_urls: imageUrls,
        });

    } catch (error) {
        errorLog(`Erro ao buscar detalhes do produto ID ${productID}`, error);
        return res.status(500).json({ message: 'Erro no servidor ao buscar detalhes.' });
    }
};

// =======================================================
// 4. Atualizar Produto (UpdateProductWithImages) - NOVO COMPLETO
// Esta função lida com atualização de texto e substituição de imagens
// =======================================================
export const updateProductWithImages = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    // req.body é preenchido pelo Multer com os campos de texto
    const { name, description, price } = req.body; 
    const userId = req.userId;
    const productID = parseInt(id);
    // Arquivos novos enviados pelo Multer
    const newFiles = req.files as Express.Multer.File[] | undefined; 

    if (!userId) {
        cleanupFiles(newFiles);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
    }
    if (isNaN(productID) || !name || !price) {
        cleanupFiles(newFiles);
        return res.status(400).json({ message: 'ID de produto, Nome e Preço são obrigatórios.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validação de Propriedade
        const [existingRows]: any = await connection.execute(
            'SELECT user_id FROM products WHERE id = ?', 
            [productID]
        );
        
        const existingProduct = existingRows[0];
        
        if (!existingProduct) {
            await connection.rollback();
            cleanupFiles(newFiles);
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }


        // 2. Atualizar os dados de texto do Produto
        await connection.execute(
            'UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?',
            [name, description, price, productID]
        );

        // 3. Lidar com a substituição de Imagens (SE houverem novos arquivos)
        if (newFiles && newFiles.length > 0) {
            // A. Busca os caminhos dos arquivos antigos
            const [oldImageRows]: any = await connection.execute(
                'SELECT image_url FROM product_images WHERE product_id = ?', 
                [productID]
            );

            // B. Deleta Imagens Antigas do Sistema de Arquivos (FS)
            oldImageRows.forEach((image: { image_url: string }) => { 
                const fullPath = `./uploads/${image.image_url.trim()}`;
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    devLog(`Arquivo antigo deletado: ${fullPath}`);
                }
            });

            // C. Deleta Registros Antigos de Imagem no Banco de Dados
            await connection.execute(
                'DELETE FROM product_images WHERE product_id = ?', 
                [productID]
            );

            // D. Insere as Novas Imagens na tabela 'product_images'
            const imageInserts = newFiles.map(file => {
                const image_url = file.path.replace(/uploads[/\\]/, ''); 
                return connection.execute(
                    'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
                    [productID, image_url]
                );
            });
            await Promise.all(imageInserts);
            
            devLog(`Total de ${newFiles.length} novas imagens salvas.`);
        }
        // Se NÃO houverem novos arquivos, apenas os dados de texto são atualizados.

        await connection.commit();

        return res.status(200).json({ message: 'Produto atualizado com sucesso!' });

    } catch (error) {
        await connection.rollback();
        cleanupFiles(newFiles); 
        errorLog(`Erro ao atualizar produto ID ${productID}`, error);
        return res.status(500).json({ message: 'Erro no servidor ao atualizar produto.' });
    } finally {
        connection.release();
    }
};


// =======================================================
// 5. Deletar Produto (DeleteProduct) - (INALTERADA)
// =======================================================
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; 
    const userId = req.userId; 
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

        const [productRows]: any = await connection.execute(
            'SELECT user_id FROM products WHERE id = ?', 
            [productID]
        );
        
        const product = productRows[0];
        
        if (!product) {
            await connection.rollback();
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        const [imageRows]: any = await connection.execute(
            'SELECT image_url FROM product_images WHERE product_id = ?', 
            [productID]
        );
        
        if (imageRows.length > 0) {
            imageRows.forEach((image: { image_url: string }) => { 
                const fullPath = `./uploads/${image.image_url.trim()}`;
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    devLog(`Arquivo deletado: ${fullPath}`);
                } else {
                    devLog(`Caminho não encontrado para exclusão: ${fullPath}.`);
                }
            });
        }
        
        await connection.execute(
            'DELETE FROM product_images WHERE product_id = ?', 
            [productID]
        );
        
        await connection.execute(
            'DELETE FROM products WHERE id = ?', 
            [productID]
        );
        
        await connection.commit(); 

        return res.status(200).json({ message: 'Produto deletado com sucesso, incluindo todas as imagens.' });

    } catch (error) {
        await connection.rollback(); 
        errorLog(`Erro ao deletar produto ID ${productID}`, error);
        return res.status(500).json({ message: 'Erro no servidor ao deletar produto.' });
    } finally {
        connection.release(); 
    }
};