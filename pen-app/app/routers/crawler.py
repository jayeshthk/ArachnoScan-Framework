from fastapi import APIRouter, HTTPException
from app.models.crawler import CrawlerRequest, CrawlerResponse
from app.services.crawler import run_crawler
import asyncio

router = APIRouter()

@router.post("/", response_model=CrawlerResponse)
async def run_crawler_endpoint(request: CrawlerRequest):
    try:
        results = await run_crawler(
            urls=request.urls,
            inside=request.inside,
            threads=request.threads,
            depth=request.depth,
            max_size=request.max_size,
            insecure=request.insecure,
            subs=request.subs,
            json=request.json,
            show_source=request.show_source,
            show_where=request.show_where,
            headers_str=request.headers,
            unique=request.unique,
            proxy=request.proxy,
            timeout=request.timeout,
            disable_redirects=request.disable_redirects
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))