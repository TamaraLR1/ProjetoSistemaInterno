import { Router } from 'express';
import { 
    createCategory, 
    getCategories, 
    getCategoryById, 
    updateCategory, 
    deleteCategory 
} from '../controllers/category.controller';

const router = Router();

// Buscar todas as categorias
router.get('/categories', getCategories);

// Criar nova categoria 
router.post('/categories', createCategory);

// Buscar uma categoria específica por ID
router.get('/categories/:id', getCategoryById); 

// Editar uma categoria
router.put('/categories/:id', updateCategory); 

// Excluir uma categoria
router.delete('/categories/:id', deleteCategory);

export default router;