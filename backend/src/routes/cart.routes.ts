import { Router } from 'express';
import { 
    addToCart, 
    getCartCount, 
    getCartItems,    // NOVO: Listar itens
    updateCartItem,  // NOVO: Mudar quantidade
    removeCartItem   // NOVO: Excluir item
} from '../controllers/cart.controller';

import { protect } from '../middlewares/auth.middleware'; // Seu middleware de JWT

const router = Router();

// Todas as rotas de carrinho precisam de login
router.post('/cart/add', protect, addToCart);
router.get('/cart/count', protect, getCartCount);


// ROTAS PARA A PÁGINA DO CARRINHO
router.get('/cart', protect, getCartItems);
router.put('/cart/update', protect, updateCartItem);
router.delete('/cart/remove/:productId', protect, removeCartItem);

export default router;