// js/config.js

// 1. Definição Global de Ambiente
window.isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. Definição de URLs Base
window.API_URL = window.isDev 
    ? 'http://localhost:5000/api' 
    : 'https://ecommerceback.tamaralr.com.br/api';

window.IMG_BASE_URL = window.isDev 
    ? 'http://localhost:5000/uploads' 
    : 'https://ecommerceback.tamaralr.com.br/uploads';

// Você pode até adicionar outras configs aqui no futuro
window.APP_NAME = "Meu Ecommerce";
console.log(`Ambiente: ${window.isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);