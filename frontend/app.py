import os

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    backend_base_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    return render_template("index.html", backend_base_url=backend_base_url)


@app.route("/applications/<app_id>")
def application_details(app_id: str):
    backend_base_url = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    return render_template(
        "application_details.html",
        backend_base_url=backend_base_url,
        app_id=app_id,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("FRONTEND_PORT", "5000")), debug=True)
