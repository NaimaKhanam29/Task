const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const PORT = 3000;

// Serve static .html pages like home.html, FindaTask.html, etc.
function serveHtml(res, fileName) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    } else {
        res.writeHead(404);
        res.end('Page not found');
    }
}

const server = http.createServer((req, res) => {
    const url = req.url;

    // 🔁 Serve homepage (registration)
    if (req.method === 'GET' && url === '/') {
        serveHtml(res, 'registration.html');
    }

    // ✅ Serve any HTML file like FindaTask.html
    else if (req.method === 'GET' && url.endsWith('.html')) {
        const filePath = path.join(__dirname, url);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else {
            res.writeHead(404);
            res.end('Page not found');
        }
    }

    // 🧠 Register user from registration.html
    else if (req.method === 'POST' && url === '/register') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const data = querystring.parse(body);
            const newUser = {
                name: data.name,
                age: data.age,
                purpose: data.purpose,
                email: data.email,
                password: data.password
            };

            let users = [];
            if (fs.existsSync('users.json')) {
                users = JSON.parse(fs.readFileSync('users.json'));
            }

            const exists = users.find(user => user.email === newUser.email);
            if (exists) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                return res.end(`<h2>Email already registered!</h2><a href="/">Try Again</a>`);
            }

            users.push(newUser);
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

            // Redirect to home.html
            res.writeHead(302, { Location: '/home.html' });
            res.end();
        });
    }

    // 📦 Serve images from /image folder
    else if (req.method === 'GET' && url.startsWith('/image/')) {
        const imagePath = path.join(__dirname, url);
        if (fs.existsSync(imagePath)) {
            const ext = path.extname(imagePath);
            const contentType = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.avif': 'image/avif',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
            }[ext] || 'application/octet-stream';

            const img = fs.readFileSync(imagePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(img);
        } else {
            res.writeHead(404);
            res.end('Image not found');
        }
    }

    // 🔎 Handle task search
    else if (req.method === 'GET' && url.startsWith('/search-tasks')) {
        const urlParts = new URL(url, `http://${req.headers.host}`);
        const query = urlParts.searchParams.get('query');

        if (!query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing search query' }));
        }

        const tasksFile = path.join(__dirname, 'tasks.json');
        if (!fs.existsSync(tasksFile)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify([]));
        }

        const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
        const results = tasks.filter(task =>
            task.name.toLowerCase().includes(query.toLowerCase())
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
    }

    // ❌ Everything else
    else {
        res.writeHead(404);
        res.end('Page not found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
