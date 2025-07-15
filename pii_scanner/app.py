from flask import Flask
from config import Config
from routes.api_routes import routes
from flask_cors import CORS


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # ✅ Allow React frontend
CORS(app)  # Allow all origins (for local testing)

app = Flask(__name__)
app.config.from_object(Config)
app.register_blueprint(routes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
