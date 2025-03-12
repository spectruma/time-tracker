# Time Tracker Application

A comprehensive time tracking solution with React frontend and FastAPI backend.

## Repository Structure

- `/frontend` - React application
- `/backend` - FastAPI application

## Development Setup

### Prerequisites

- Node.js v18+
- Python 3.12+
- PostgreSQL
- Redis
- Elasticsearch

### Backend Setup

See [backend/README.md](backend/README.md) for detailed instructions.

### Frontend Setup

See [frontend/README.md](frontend/README.md) for detailed instructions.

### Running the Full Stack

```bash
# Start the backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# In another terminal, start the frontend
cd frontend
npm run dev
```


### 4. Docker-compose (Optional)

For simplified development and deployment:

````yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - POSTGRES_SERVER=db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=time_tracker
      - REDIS_HOST=redis
      - ELASTICSEARCH_HOST=elasticsearch
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
      - elasticsearch

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=time_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.10.4
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

volumes:
  postgres_data:
````
