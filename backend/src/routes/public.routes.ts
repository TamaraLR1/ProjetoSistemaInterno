import { Router } from 'express';
import { getPublicProducts, getProductsByCategory, getProductById } from '../controllers/public.controller';

const router = Router();

// Rota principal da vitrine
router.get('/products', getPublicProducts);

// Rota para pegar produto por id
router.get('/products/:id', getProductById);

// Rota para filtros de categoria
router.get('/products/category/:category', getProductsByCategory);

export default router;