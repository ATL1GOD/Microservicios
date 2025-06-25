const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
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
    logger.info('Ventas: Conectado a MySQL');
});

// GET /ventas
app.get('/ventas', (req, res) => {
    db.query('SELECT * FROM ventas', (err, result) => {
        if (err) {
            logger.error('Error al obtener ventas: ' + err.message);
            return res.status(500).send('Error');
        }
        logger.info('Ventas consultadas correctamente');
        res.json(result);
    });
});

// DELETE /limpiarVentas
app.delete('/limpiarVentas', (req, res) => {
    db.query('DELETE FROM ventas', (err) => {
        if (err) {
            logger.error('Error al limpiar ventas: ' + err.message);
            return res.status(500).send('Error');
        }
        logger.info('Ventas eliminadas correctamente');
        res.send('Historial de ventas limpio');
    });
});

app.listen(port, () => {
    logger.info(`Ventas escuchando en http://localhost:${port}`);
});
