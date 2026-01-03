import { Router, RequestHandler } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { parseUpload } from '../middlewares/upload.middleware';
import { 
    createProduct, 
    listProducts, 
    getProductDetails, 
    updateProductWithImages,
    deleteProduct 
} from '../controllers/product.controller'; 

const router = Router();

// Rota POST: Cadastro (Já estava protegida)
router.post('/products', [
    protect, 
    parseUpload('product-images', 5), 
    createProduct
] as RequestHandler[]); 

// Rota GET: Listar (ALTERADA: Adicionado o middleware protect para filtrar por usuário)
router.get('/products', [protect, listProducts] as RequestHandler[]); 

// Rota GET: Detalhes (Protegida)
router.get('/products/:id', [protect, getProductDetails] as RequestHandler[]);

// Rota PUT: Atualizar (Protegida)
router.put('/products/:id', [
    protect, 
    parseUpload('product-images', 5), 
    updateProductWithImages
] as RequestHandler[]);

// Rota DELETE: Excluir (Protegida)
router.delete('/products/:id', [protect, deleteProduct] as RequestHandler[]);

export default router;