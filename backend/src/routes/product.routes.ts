// Caminho: src/routes/product.routes.ts

import { Router, RequestHandler } from 'express'; // Importar RequestHandler
import multer from 'multer';
import { protect } from '../middlewares/auth.middleware';
import { 
    createProduct, 
    listProducts, 
    getProductDetails, 
    updateProduct 
} from '../controllers/product.controller'; 
import path from 'path'; 

const router = Router();

// =======================================================
// Configuração do Multer (inalterada)
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

// Rota POST: Cadastro de Produto
// Já estava correta com o cast RequestHandler[]
router.post('/products', [
    protect, 
    upload.array('product-images', 5), 
    createProduct
] as RequestHandler[]); 

// Rota GET: Listar Todos os Produtos (PÚBLICA - Inalterada)
router.get('/products', listProducts); 

// Rota GET: Detalhes do Produto (CORRIGIDA - LINHA 44)
router.get('/products/:id', [protect, getProductDetails] as RequestHandler[]);

// Rota PUT: Atualizar Produto (CORRIGIDA)
router.put('/products/:id', [protect, updateProduct] as RequestHandler[]);

export default router;