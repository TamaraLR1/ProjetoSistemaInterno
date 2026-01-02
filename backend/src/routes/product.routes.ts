import { Router, RequestHandler } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { parseUpload } from '../middlewares/upload.middleware'; // Importa a função tratada
import { 
    createProduct, 
    listProducts, 
    getProductDetails, 
    updateProductWithImages,
    deleteProduct 
} from '../controllers/product.controller'; 

const router = Router();

// Rota POST: Cadastro
router.post('/products', [
    protect, 
    parseUpload('product-images', 5), 
    createProduct
] as RequestHandler[]); 

// Rota GET: Listar
router.get('/products', listProducts); 

// Rota GET: Detalhes
router.get('/products/:id', [protect, getProductDetails] as RequestHandler[]);

// Rota PUT: Atualizar
router.put('/products/:id', [
    protect, 
    parseUpload('product-images', 5), 
    updateProductWithImages
] as RequestHandler[]);

// Rota DELETE: Excluir
router.delete('/products/:id', [protect, deleteProduct] as RequestHandler[]);

export default router;