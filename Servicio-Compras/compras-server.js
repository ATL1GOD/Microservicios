const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

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
        new winston.transports.Console(), // Log en consola
        new winston.transports.File({ filename: 'logs/errores.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/todo.log' })
    ]
});

// Logging HTTP con Morgan + Winston
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Conexión a MySQL
const db = mysql.createConnection({
    user: 'root',
    password: 'Atl1God$',
    database: 'cineboletos',
    socketPath: '/cloudsql/white-option-462703-s8:us-central1:cine'
});

db.connect(err => {
    if (err) {
        logger.error('Error al conectar a MySQL: ' + err.message);
        return;
    }
    logger.info('Conectado a MySQL (compras-service)');
});

// POST /comprar
app.post('/comprar', (req, res) => {
    const { nombre_cliente, cantidad, pelicula } = req.body;

    if (!nombre_cliente || !cantidad || !pelicula) {
        logger.warn('Compra fallida: faltan datos');
        return res.status(400).json({ error: 'Faltan datos necesarios' });
    }

    db.query('SELECT stock FROM peliculas WHERE nombre = ?', [pelicula], (err, result) => {
        if (err || result.length === 0) {
            logger.error(`Error verificando stock para ${pelicula}: ${err?.message}`);
            return res.status(500).send('Error al verificar los boletos');
        }

        const stockDisponible = result[0].stock;

        if (stockDisponible < cantidad) {
            logger.info(`Compra rechazada por stock insuficiente: ${pelicula}`);
            return res.status(400).json({ error: 'No hay suficientes boletos disponibles' });
        }

        db.query('UPDATE peliculas SET stock = stock - ? WHERE nombre = ?', [cantidad, pelicula], (err) => {
            if (err) {
                logger.error('Error actualizando stock: ' + err.message);
                return res.status(500).send('Error al actualizar el stock');
            }

            db.query('INSERT INTO ventas (nombre_cliente, cantidad, pelicula) VALUES (?, ?, ?)',
                [nombre_cliente, cantidad, pelicula], (err) => {
                    if (err) {
                        logger.error('Error registrando venta: ' + err.message);
                        return res.status(500).send('Error al registrar la venta');
                    }
                    logger.info(`Venta realizada: ${nombre_cliente} compró ${cantidad} boletos de ${pelicula}`);
                    res.status(200).json({ success: true });
                });
        });
    });
});

app.listen(port, () => {
    logger.info(`Microservicio de compras escuchando en http://localhost:${port}`);
});
