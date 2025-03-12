# Time Tracker Backend

## Description

This project is the backend API for a comprehensive time tracking application. It provides a robust and scalable solution for managing users, tracking work hours, handling leave requests, and generating insightful analytics. Built with FastAPI and leveraging modern technologies, it ensures performance, security, and ease of use.

## Features

- **User Management:**
    - User registration and authentication
    - Role-based access control and permissions
    - User profile management
- **Time Entry Tracking:**
    - Record work hours with project and task details
    - Flexible time entry creation and modification
    - Reporting and summaries of time entries
- **Leave Request Management:**
    - Submit and manage leave requests (vacation, sick leave, etc.)
    - Approval workflows for leave requests
    - Holiday calendar integration
- **Analytics:**
    - Generate reports on time tracking data
    - Visualize key metrics and trends
    - Customizable analytics dashboards
- **Authentication and Security:**
    - Secure API endpoints with JWT (JSON Web Token) authentication
    - Rate limiting to prevent abuse
    - Security headers for enhanced protection
- **Compliance Features:**
    - Configurable working time limits (weekly hours, daily rest)
    - Audit logging for compliance and security monitoring

## Technologies Used

- **Backend Framework:** [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.
- **ASGI Server:** [Uvicorn](https://www.uvicorn.org/) - An ASGI web server implementation for Python.
- **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit and Object Relational Mapper.
- **Database:** [PostgreSQL](https://www.postgresql.org/) - A powerful, open source object-relational database system.
- **Asynchronous Database Driver:** [asyncpg](https://magicstack.github.io/asyncpg/current/) - A fast, batteries-included, pure Python PostgreSQL driver, built for asyncio.
- **Database Migrations:** [Alembic](https://alembic.sqlalchemy.org/en/latest/) - A lightweight database migration tool for SQLAlchemy.
- **In-Memory Data Store:** [Redis](https://redis.io/) - An open source, in-memory data structure store, used for caching and rate limiting.
- **Search Engine:** [Elasticsearch](https://www.elastic.co/) - A distributed, RESTful search and analytics engine.
- **Settings Management:** [pydantic-settings](https://pydantic-docs.basemodel.dev/pydantic_settings/) - Settings management using Pydantic.
- **Data Validation:** [Pydantic](https://pydantic-docs.basemodel.dev/) - Data validation and settings management using Python type hints.
- **JWT Authentication:** [python-jose](https://python-jose.readthedocs.io/en/latest/) - A Python implementation of the JOSE (JSON Object Signing and Encryption) specifications.
- **Task Queue (Optional):** [Celery](https://docs.celeryq.dev/en/stable/) - Asynchronous task queue/job queue based on distributed message passing.

## Installation

### Prerequisites

- [Python 3.12+](https://www.python.org/downloads/) installed on your system.
- [pip](https://pip.pypa.io/en/stable/installation/) - Python package installer (usually comes with Python installations).
- [Docker](https://www.docker.com/) (optional, if you want to run database, Redis, Elasticsearch in containers).

### Steps

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd time-tracker-backend
   ```

2. **Set up a virtual environment:**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Linux/macOS
   .venv\Scripts\activate  # On Windows
   ```

3. **Install dependencies:**

   ```bash
   pip install -e .
   ```
   Alternatively, you can install dependencies individually:
   ```bash
   pip install fastapi uvicorn sqlalchemy alembic asyncpg "passlib[argon2]" pydantic pydantic-settings "python-jose[cryptography]" python-multipart redis elasticsearch celery pandas openpyxl
   pip install pytest pytest-asyncio httpx mypy black isort flake8 # Development dependencies
   ```

4. **Configure environment variables:**

   - Create a `.env` file in the project root directory.
   - Define the following environment variables (example `.env` content):

     ```env
     PROJECT_NAME="Time Tracker"
     BACKEND_CORS_ORIGINS=["http://localhost:8080", "http://localhost:3000"]

     SECRET_KEY="your-secret-key-here" # Generate a strong secret key
     ALGORITHM="HS256"
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     REFRESH_TOKEN_EXPIRE_DAYS=7

     POSTGRES_SERVER="localhost" # or your database host
     POSTGRES_USER="postgres"
     POSTGRES_PASSWORD="postgres_password"
     POSTGRES_DB="time_tracker_db"

     REDIS_HOST="localhost" # or your redis host
     REDIS_PORT=6379
     REDIS_PASSWORD="" # or your redis password

     ELASTICSEARCH_HOST="localhost" # or your elasticsearch host
     ELASTICSEARCH_PORT=9200

     AUDIT_RETENTION=180
     WORKING_TIME_MAX_WEEKLY_HOURS=48
     WORKING_TIME_MIN_DAILY_REST=11
     ```
     **Note:** Replace placeholder values with your actual configurations. Ensure `SECRET_KEY` is a strong, randomly generated string.

## Configuration

The backend application is configured using environment variables. Below are the key configuration categories and variables:

- **API Settings:**
    - `PROJECT_NAME`: Name of the project (e.g., "Time Tracker").
    - `BACKEND_CORS_ORIGINS`: List of allowed origins for Cross-Origin Resource Sharing (CORS). Example: `["http://localhost:8080", "http://localhost:3000"]`.

- **Security Settings:**
    - `SECRET_KEY`: Secret key used for JWT token generation and verification. **Important:** Use a strong, randomly generated secret key in production.
    - `ALGORITHM`: Algorithm used for JWT encoding (default: `HS256`).
    - `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for access tokens in minutes (default: `30`).
    - `REFRESH_TOKEN_EXPIRE_DAYS`: Expiration time for refresh tokens in days (default: `7`).

- **Database Settings (PostgreSQL):**
    - `POSTGRES_SERVER`: Hostname or IP address of the PostgreSQL server.
    - `POSTGRES_USER`: PostgreSQL database username.
    - `POSTGRES_PASSWORD`: PostgreSQL database password.
    - `POSTGRES_DB`: Name of the PostgreSQL database.

- **Redis Settings:**
    - `REDIS_HOST`: Hostname or IP address of the Redis server.
    - `REDIS_PORT`: Port number of the Redis server (default: `6379`).
    - `REDIS_PASSWORD`: Password for Redis authentication (if required).

- **Elasticsearch Settings:**
    - `ELASTICSEARCH_HOST`: Hostname or IP address of the Elasticsearch server.
    - `ELASTICSEARCH_PORT`: Port number of the Elasticsearch server (default: `9200`).

- **Compliance Settings:**
    - `AUDIT_RETENTION`: Number of days to retain audit logs (default: `180`).
    - `WORKING_TIME_MAX_WEEKLY_HOURS`: Maximum allowed working hours per week (default: `48`, EU Working Time Directive).
    - `WORKING_TIME_MIN_DAILY_REST`: Minimum daily rest period in hours (default: `11` hours).

## Database Migrations

To apply database migrations and set up the database schema, use Alembic:

```bash
alembic upgrade head
```
This command will run all pending migration scripts and update the database schema to the latest version.

## Running the Application

To start the backend application, use the following command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- `app.main:app`: Specifies the application instance (`app`) in the `main.py` module within the `app` directory.
- `--host 0.0.0.0`: Binds the application to all network interfaces.
- `--port 8000`: Runs the application on port 8000.
- `--reload`: Enables automatic code reloading for development.

The API will be accessible at `http://localhost:8000/api/v1`.

## API Documentation

- **OpenAPI Specification (JSON):** [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)
- **Swagger UI:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

Browse the Swagger UI for interactive API documentation and testing of endpoints.

## Health Check

The API provides health check endpoints to monitor the status of the application and its dependencies:

- **Root Endpoint (`/`):** Returns a basic health status and API version.
  [http://localhost:8000/](http://localhost:8000/)
- **`/health` Endpoint:** Provides detailed health information, including the status of the API, database, Redis cache, and Elasticsearch search engine.
  [http://localhost:8000/health](http://localhost:8000/health)

## Testing

*(Tests are planned for future development. Currently, no automated tests are implemented.)*

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a branch for your feature or bug fix.
3. Implement your changes and ensure they are well-tested.
4. Submit a pull request with a clear description of your changes.

## License

*(License information will be added in the future.)*
