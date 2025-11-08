// Caminho: src/routes/product.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middlewares/auth.middleware';
import { createProduct, listProducts, getProductDetails, updateProduct } from '../controllers/product.controller'; 
import path from 'path'; 

const router = Router();

// =======================================================
// Configuração do Multer (Permanece inalterada)
// =======================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); 
        cb(null, file.fieldname + '-' + uniqueSuffix + extension); 
    }
});

const upload = multer({ storage: storage }); 
// =======================================================

// Rota 1: Cadastrar Produto (POST)
router.post('/products', protect, upload.single('productImage'), createProduct); 

// Rota 2: Listar Todos os Produtos (GET)
router.get('/products', listProducts); 

// 🌟 NOVO: Rota 3: Buscar Detalhes de UM produto por ID (GET)
// Usamos 'protect' para garantir que apenas usuários logados possam ver os detalhes.
router.get('/products/:id', protect, getProductDetails); 

// 🌟 NOVO: Rota 4: Atualizar Produto por ID (PUT)
// O nome do campo de arquivo ('product-images') deve corresponder ao que é enviado no frontend.
router.put('/products/:id', protect, upload.single('product-images'), updateProduct); 

export default router;