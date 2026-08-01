FROM python:3.12-slim

WORKDIR /app

COPY frontend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY . /app

EXPOSE 5000

CMD ["python", "frontend/app.py"]
