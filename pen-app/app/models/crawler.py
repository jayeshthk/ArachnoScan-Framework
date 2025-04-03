from pydantic import BaseModel
from typing import Dict, List, Optional

class Node(BaseModel):
    id: str
    label: str
    url: str
    analysis: str

class Edge(BaseModel):
    id: str
    source: str
    target: str

class CrawlerRequest(BaseModel):
    urls: List[str]
    inside: bool = False
    threads: int = 8
    depth: int = 2
    max_size: int = -1
    insecure: bool = False
    subs: bool = False
    json: bool = False
    show_source: bool = False
    show_where: bool = False
    headers: str = ""
    unique: bool = False
    proxy: str = ""
    timeout: int = -1
    disable_redirects: bool = False

    class Config:
        schema_extra = {
            "example": {
                "urls": ["https://qubric.in"],
                "depth": 2,
                "threads": 8,
                "unique": True
            }
        }

class CrawlerResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]