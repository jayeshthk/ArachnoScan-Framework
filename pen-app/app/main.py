from fastapi import FastAPI
from app.routers import crawler
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Website Mapper API",
    description="API for mapping website structure and relationships",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with allowed domains for security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(crawler.router, prefix="/api/crawler", tags=["Website Mapping"])

@app.get("/health")
def health_check():
    return {"status": "ok"}