import { storage } from "./storage";

export async function initializeTemplates() {
  const existingTemplates = await storage.getTemplates();
  if (existingTemplates.length > 0) return;

  const templates = [
    {
      name: "Node.js Backend",
      type: "nodejs",
      description: "Express.js REST API server with Node.js",
      files: JSON.stringify([
        {
          path: "package.json",
          content: `{
  "name": "nodejs-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}`,
          language: "json"
        },
        {
          path: "server.js",
          content: `const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
          language: "javascript"
        },
        {
          path: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Node.js App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    button { padding: 10px 20px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Node.js Backend Application</h1>
  <button onclick="fetchData()">Call API</button>
  <p id="result"></p>
  
  <script>
    async function fetchData() {
      const res = await fetch('/api/hello');
      const data = await res.json();
      document.getElementById('result').textContent = data.message;
    }
  </script>
</body>
</html>`,
          language: "html"
        }
      ])
    },
    {
      name: "React App",
      type: "react",
      description: "Modern React application with JSX",
      files: JSON.stringify([
        {
          path: "package.json",
          content: `{
  "name": "react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}`,
          language: "json"
        },
        {
          path: "src/App.jsx",
          content: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>React Counter App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
          language: "javascript"
        },
        {
          path: "src/index.css",
          content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen';
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.app {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

button {
  padding: 10px 20px;
  cursor: pointer;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}`,
          language: "css"
        }
      ])
    },
    {
      name: "Python Flask API",
      type: "python",
      description: "Flask backend with REST API",
      files: JSON.stringify([
        {
          path: "requirements.txt",
          content: `Flask==2.3.0
Flask-CORS==4.0.0
python-dotenv==1.0.0`,
          language: "plaintext"
        },
        {
          path: "app.py",
          content: `from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/message', methods=['GET'])
def get_message():
    return jsonify({'message': 'Hello from Flask!'})

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({
        'status': 'success',
        'data': [1, 2, 3, 4, 5]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)`,
          language: "python"
        }
      ])
    },
    {
      name: "HTML/CSS/JS",
      type: "html",
      description: "Vanilla HTML, CSS, and JavaScript project",
      files: JSON.stringify([
        {
          path: "index.html",
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav class="navbar">
    <h1>My Web App</h1>
  </nav>
  
  <main class="container">
    <section>
      <h2>Welcome</h2>
      <p>This is a vanilla JavaScript web application.</p>
      <button id="btn">Click Me</button>
      <p id="output"></p>
    </section>
  </main>

  <script src="script.js"></script>
</body>
</html>`,
          language: "html"
        },
        {
          path: "style.css",
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

.navbar {
  background: rgba(0,0,0,0.2);
  padding: 20px;
  color: white;
}

.container {
  max-width: 800px;
  margin: 40px auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

button:hover {
  background: #764ba2;
}`,
          language: "css"
        },
        {
          path: "script.js",
          content: `document.getElementById('btn').addEventListener('click', function() {
  document.getElementById('output').textContent = 'Button clicked at ' + new Date().toLocaleTimeString();
});`,
          language: "javascript"
        }
      ])
    }
  ];

  for (const template of templates) {
    try {
      await storage.createTemplate(template as any);
      console.log("Created template: " + template.name);
    } catch (error) {
      console.error("Error creating template " + template.name + ":", error);
    }
  }
}
