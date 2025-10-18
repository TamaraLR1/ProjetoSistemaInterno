// Dentro de auth.routes.ts
import { Router } from 'express';
import { loginUser, logoutUser } from '../controllers/auth.controller'; // [ALTERADO] Importe logoutUser

const router = Router();

// Rota de login
router.post('/login', loginUser);

// [NOVO] Rota de logout
router.post('/logout', logoutUser); // Use POST para logout como boa prática de CSRF

export default router;