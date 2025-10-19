// server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; 
import path from 'path'; // <--- GARANTIR QUE ESTÁ IMPORTADO

import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes'; 
import productRoutes from './routes/product.routes'; // Importar rotas de produto

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração do CORS
app.use(cors({
    origin: 'http://localhost:8000', 
    credentials: true, 
}));

app.use(express.json());
app.use(cookieParser()); 

// 1. Define o caminho absoluto para a pasta 'uploads'
//    path.join(__dirname, '..', 'uploads') deve apontar para backend/uploads
const UPLOADS_PATH = path.join(__dirname, '..', 'uploads');

// 2. LOG de Verificação (Para rodar no seu terminal Node.js/Nodemon)
console.log('Caminho Absoluto de Uploads sendo usado:', UPLOADS_PATH); 

// 3. Configuração do middleware estático
//    O Express responde a URLs que começam com /uploads
app.use('/uploads', express.static(UPLOADS_PATH));

app.use('/api', userRoutes);
app.use('/api', authRoutes);
app.use('/api', productRoutes); // Incluir rotas de produto

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});