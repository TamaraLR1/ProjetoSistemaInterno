// src/routes/product.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middlewares/auth.middleware';
import { createProduct, listProducts } from '../controllers/product.controller'; 
import path from 'path'; // NOVO: Módulo path para lidar com extensões

const router = Router();

// =======================================================
// CORREÇÃO: Usar diskStorage para adicionar a extensão
// =======================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define a pasta de destino (no mesmo nível de 'src/')
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Cria um nome único com timestamp + a extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // Obtém a extensão (.jpg, .png)
        cb(null, file.fieldname + '-' + uniqueSuffix + extension); // Salva com o nome único E a extensão
    }
});

const upload = multer({ storage: storage }); 
// =======================================================

// Rota 1: Cadastrar Produto (usando o novo Multer)
router.post('/products', protect, upload.single('productImage'), createProduct); 

// Rota 2: Listar Todos os Produtos
router.get('/products', listProducts); 

export default router;