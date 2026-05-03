// server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; 
import path from 'path'; // <--- GARANTIR QUE ESTÁ IMPORTADO

import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes'; 
import productRoutes from './routes/product.routes'; // Importar rotas de produto

import inventoryRoutes from './routes/inventory.routes';
import publicRoutes from './routes/public.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // ESSENCIAL para cookies em produção (Cloudflare/Proxy)
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser()); 

// server.ts

const allowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://ecommerce.tamaralr.com.br',
    'https://ecommerce.tamaralr.com.br/'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (como mobile apps ou curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política CORS para este site não permite acesso da origem informada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    exposedHeaders: ['set-cookie'] // Importante para alguns navegadores visualizarem o cookie
}));


// 1. Define o caminho absoluto para a pasta 'uploads'
//    path.join(__dirname, '..', 'uploads') deve apontar para backend/uploads
const UPLOADS_PATH = path.join(__dirname, '..', 'uploads');

// 2. LOG de Verificação (Para rodar no seu terminal Node.js/Nodemon)
console.log('Caminho Absoluto de Uploads sendo usado:', UPLOADS_PATH); 


// 3. Configuração do middleware estático
//    O Express responde a URLs que começam com /uploads
app.use('/uploads', express.static(UPLOADS_PATH));

// Rotas Públicas (Sem autenticação)
app.use('/api/public', publicRoutes);
app.use('/api', categoryRoutes);

app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', productRoutes); // Incluir rotas de produto
app.use('/api/inventory', inventoryRoutes);
app.use('/api', cartRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});