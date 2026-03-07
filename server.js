import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// server configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;

// setup express server
const app = express();

// initialize PostgreSQL session store
// const pgSession = connectPgSimple(session);

// configure session middleware
// ...

// configure express
app.use(express.static(path.join(__dirname, 'public')));
// allow express to receive and process POST data
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
// start automatic session cleanup
// startSessionCleanup();

// global middleware
// ...

// routes
// app.use('/', routes);

// error handling
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// global error handler
app.use((err, req, res, next) => {
    // prevent infinite loops; if a response has already been sent, do nothing
    if (res.headersSent || res.finished) {
        return next(err);
    }

    // determine status and template
    const status = err.status || 500;
    const template = status === 400 ? '404' : '500';

    // prepare data for the template
    const context = {
        title: status === 400 ? 'Page Not Found' : 'Server Error',
        // only reveal error details/message if we're in development
        error: NODE_ENV === 'production' ? 'An error occurred' : err.message,
        // only display the call stack before the program threw an error if we're in development
        stack: NODE_ENV === 'production' ? null : err.stack,
        NODE_ENV // our WebSocket check needs this and it's convenient to pass along
    }

    // render the appropriate error template with fallback
    try {
        res.status(status).render(`errors/${template}`, context);
    } catch (renderErr) {
        // if rendering fails, send a simple error page instead
        if (!res.headersSent) {
            res.status(status).send(`<h1>Error: ${status}</h1><p>An error occurred.</p>`);
        }
    }
});

if (NODE_ENV.includes('dev')) {
    const ws = await import('ws');

    try {
        const wsPort = parseInt(PORT) + 1;
        const wsServer = new ws.WebSocketServer({ port: wsPort });

        wsServer.on('listening', () => {
            console.log(`WebSocket serveris running on port ${wsPort}`);
        });

        wsServer.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

// start server
app.listen(PORT, async () => {
    // await setupDatabase();
    // await testConnection();
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});