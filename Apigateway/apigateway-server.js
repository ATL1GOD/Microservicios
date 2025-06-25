const express = require('express');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Asegurar que exista la carpeta "logs"
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Logger con Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/errores.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/todo.log' })
    ]
});

// Configurar CORS
app.use(cors({
    origin: '*',  // Permite solicitudes de cualquier origen (puedes cambiarlo para restringir ciertos orígenes)
    methods: ['GET', 'POST', 'DELETE'],  // Métodos permitidos
    allowedHeaders: ['Content-Type']  // Cabeceras permitidas
}));

// Middleware
app.use(express.json());
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Ruta: Películas
app.get('/api/peliculas', async (req, res) => {
    try {
        const response = await axios.get('https://microservicio-peliculas-229692202590.northamerica-south1.run.app/peliculas');
        logger.info('Consulta de películas realizada');
        res.json(response.data);
    } catch (err) {
        logger.error('Error en /api/peliculas: ' + err.message);
        res.status(500).send('Error al obtener películas');
    }
});

// Ruta: Ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const response = await axios.get('https://microservicio-ventas-229692202590.northamerica-south1.run.app/ventas');
        logger.info('Consulta de ventas realizada');
        res.json(response.data);
    } catch (err) {
        logger.error('Error en /api/ventas: ' + err.message);
        res.status(500).send('Error al obtener ventas');
    }
});

// Ruta: Compras
app.post('/api/compras', async (req, res) => {
    try {
        const response = await axios.post('https://microservicio-compras-229692202590.europe-west1.run.app/comprar', req.body);
        logger.info(`Compra realizada por ${req.body.nombre_cliente}`);
        res.json(response.data);
    } catch (err) {
        logger.error('Error en /api/compras: ' + err.message);
        res.status(500).send('Error al realizar la compra');
    }
});

// Inicio
app.listen(port, () => {
    logger.info(`API Gateway escuchando en http://localhost:${port}`);
});
