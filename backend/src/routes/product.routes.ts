// src/routes/product.routes.ts (VERSÃO FINAL COM ARQUIVO E AUTENTICAÇÃO)

import { Router } from 'express';
import multer from 'multer'; // Reativado
import { protect } from '../middlewares/auth.middleware'; // Reativado
import { createProduct } from '../controllers/product.controller'; 

const router = Router();

// Configuração do Multer (assumindo pasta 'uploads/' na raiz do backend)
const upload = multer({ dest: 'uploads/' }); 

// Rota COMPLETA: com autenticação e processamento de arquivo
router.post('/products', protect, upload.single('productImage'), createProduct); 

export default router;