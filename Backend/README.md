
# 2D Anomaly Detection Backend

This is the FastAPI backend for the Anomaly Detection project.

## Setup Instructions

### 1. Database

Ensure you have PostgreSQL running. Update `.env` with your credentials:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=12345
POSTGRES_DB=anomaly_detection_db
DATABASE_URL=postgresql://postgres:password@localhost:5433/anomaly_detection_db
```

### 2. Environment Dependencies

Install the required packages. 
**Note:** If you encounter errors with `python-magic` or others on Windows, you may need to install C++ build tools or use binary wheels.

```bash
pip install -r requirements.txt
```

If `tensorflow-cpu` fails, you can comment it out in `requirements.txt` to run the core API.

### 3. Database Migrations

Initialize the database tables using Alembic:

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial tables"

# Apply migration
alembic upgrade head
```

### 4. Running the Server

Start the API server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Docs: `http://localhost:8000/docs`.

## Project Structure

- `app/api`: API endpoints (Auth, Users, Images, Results)
- `app/core`: Configuration & Security
- `app/db`: Database session & base models
- `app/models`: SQLAlchemy Database Models
- `app/schemas`: Pydantic Schemas for validation
- `app/crud`: Database Create/Read/Update/Delete operations
