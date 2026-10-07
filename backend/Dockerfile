# Stage 1: Build dependencies
FROM python:3.13-slim AS builder
WORKDIR /app
COPY requirements.txt .
# Install dependencies into the local user directory to easily copy them later
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime environment
FROM python:3.13-slim
WORKDIR /app

# Copy only the installed dependencies from the builder stage
COPY --from=builder /root/.local /root/.local
COPY . .

# Ensure the local bin directory is on the PATH
ENV PATH=/root/.local/bin:$PATH
ENV PORT=8001

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
