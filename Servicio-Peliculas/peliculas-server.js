const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3001;

// Configurar CORS
app.use(cors({
    origin: '*',  // Permite solicitudes de cualquier origen (puedes cambiarlo para restringir ciertos orígenes)
    methods: ['GET', 'POST', 'DELETE'],  // Métodos permitidos
    allowedHeaders: ['Content-Type']  // Cabeceras permitidas
}));

app.use(express.json());

// Logger
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

app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
}));

// Conexión MySQL
const db = mysql.createConnection({
    user: 'root',
    password: 'Atl1God$',
    database: 'cineboletos',
    socketPath: '/cloudsql/white-option-462703-s8:us-central1:cine'
});

db.connect(err => {
    if (err) {
        logger.error('Error conectando a MySQL: ' + err.message);
        return;
    }
    logger.info('Películas: Conectado a MySQL');
});

// Ruta GET /peliculas
app.get('/peliculas', (req, res) => {
    db.query('SELECT * FROM peliculas', (err, result) => {
        if (err) {
            logger.error('Error al obtener películas: ' + err.message);
            return res.status(500).send('Error');
        }
        logger.info('Películas consultadas correctamente');
        res.json(result);
    });
});

app.listen(port, () => {
    logger.info(`Películas escuchando en http://localhost:${port}`);
});
