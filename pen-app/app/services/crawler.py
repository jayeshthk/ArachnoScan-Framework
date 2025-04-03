import asyncio
import re
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import aiohttp
from aiohttp import ClientSession, ClientTimeout
from types import SimpleNamespace
from typing import Dict, List, Tuple

# Global counter for sequential IDs
_id_counter = 0

def generate_node_id(url: str) -> str:
    global _id_counter
    _id_counter += 1
    return str(_id_counter)

def generate_label(url: str) -> str:
    parsed = urlparse(url)
    if parsed.path in ('', '/'):
        return parsed.netloc
    return parsed.path

def parse_headers(raw_headers: str) -> Dict[str, str]:
    headers = {}
    if not raw_headers:
        return headers
    for header in raw_headers.split(';;'):
        if ': ' in header:
            key, val = header.split(': ', 1)
        elif ':' in header:
            key, val = header.split(':', 1)
        else:
            continue
        headers[key.strip()] = val.strip()
    return headers

async def crawl(start_url: str, results_queue: asyncio.Queue, semaphore: asyncio.Semaphore, 
                session: ClientSession, args: SimpleNamespace, url_to_id: Dict[str, str],
                nodes: List[Dict], edges: List[Dict]):
    try:
        parsed_start_url = urlparse(start_url)
        hostname = parsed_start_url.hostname
        if not hostname:
            return

        allowed_domains = [hostname] if not args.subs else None
        regex = None
        if args.subs:
            escaped_hostname = re.escape(hostname)
            pattern = re.compile(rf'.*([.]|//){escaped_hostname}(/|#|\?|$|:)')
            regex = pattern

        visited = set()
        queue = asyncio.Queue()
        await queue.put((start_url, 0))

        while not queue.empty():
            current_url, depth = await queue.get()
            if depth > args.depth or current_url in visited:
                queue.task_done()
                continue
            visited.add(current_url)

            try:
                async with semaphore:
                    timeout = ClientTimeout(total=args.timeout if args.timeout > 0 else None)
                    async with session.get(
                        current_url,
                        proxy=args.proxy,
                        allow_redirects=not args.disable_redirects,
                        timeout=timeout
                    ) as response:
                        if args.max_size > 0:
                            content_length = response.headers.get('Content-Length')
                            if content_length and int(content_length) > args.max_size * 1024:
                                continue

                        content = await response.text()
                        soup = BeautifulSoup(content, 'html.parser')

                        for tag, attr, source in [
                            ('a', 'href', 'href'),
                            ('script', 'src', 'script'),
                            ('form', 'action', 'form')
                        ]:
                            elements = soup.find_all(tag, {attr: True})
                            for el in elements:
                                link = el.get(attr)
                                abs_link = urljoin(current_url, link)
                                parsed_link = urlparse(abs_link)

                                allowed = False
                                if allowed_domains:
                                    if parsed_link.hostname in allowed_domains:
                                        allowed = True
                                elif regex:
                                    allowed = bool(regex.match(abs_link))
                                else:
                                    allowed = True

                                if not allowed:
                                    continue

                                if args.inside:
                                    start_path = parsed_start_url.path
                                    link_path = parsed_link.path
                                    if not link_path.startswith(start_path):
                                        continue

                                await results_queue.put((abs_link, current_url))
                                if depth < args.depth:
                                    await queue.put((abs_link, depth + 1))

            except Exception as e:
                print(f"Error fetching {current_url}: {e}")
            finally:
                queue.task_done()

    except asyncio.CancelledError:
        print(f"Timeout for {start_url}")
        raise

async def process_results(results_queue: asyncio.Queue, url_to_id: Dict[str, str],
                          nodes: List[Dict], edges: List[Dict], unique: bool):
    
    seen_urls = set()
    while True:
        try:
            url, parent_url = await results_queue.get()
            
            if unique and url in seen_urls:
                results_queue.task_done()
                continue
            
            # Create or get node IDs
            parent_id = url_to_id.get(parent_url)
            url_id = url_to_id.get(url)
            
            # Create parent node if not exists
            if not parent_id:
                parent_id = generate_node_id(parent_url)
                url_to_id[parent_url] = parent_id
                nodes.append({
                    "id": parent_id,
                    "label": generate_label(parent_url),
                    "url": parent_url,
                    "analysis": "Link analysis pending"
                })
            
            # Create current node if not exists
            if not url_id:
                url_id = generate_node_id(url)
                url_to_id[url] = url_id
                nodes.append({
                    "id": url_id,
                    "label": generate_label(url),
                    "url": url,
                    "analysis": "Link analysis pending"
                })
            
            # Create edge
            edge_id = f"e{parent_id}-{url_id}"
            edges.append({
                "id": edge_id,
                "source": parent_id,
                "target": url_id
            })
            
            if unique:
                seen_urls.add(url)
            
            results_queue.task_done()
        except asyncio.CancelledError:
            break

async def run_crawler(
    urls: List[str],
    inside: bool = False,
    threads: int = 8,
    depth: int = 2,
    max_size: int = -1,
    insecure: bool = False,
    subs: bool = False,
    json: bool = False,
    show_source: bool = False,
    show_where: bool = False,
    headers_str: str = '',
    unique: bool = False,
    proxy: str = '',
    timeout: int = -1,
    disable_redirects: bool = False
) -> Dict:
    args = SimpleNamespace(
        inside=inside,
        threads=threads,
        depth=depth,
        max_size=max_size,
        insecure=insecure,
        subs=subs,
        json=json,
        show_source=show_source,
        show_where=show_where,
        headers=headers_str,
        unique=unique,
        proxy=proxy,
        timeout=timeout,
        disable_redirects=disable_redirects
    )

    global _id_counter
    _id_counter = 0
    headers = parse_headers(args.headers)
    clean_urls = [url.strip() for url in urls if url.strip()]

    if not clean_urls:
        raise ValueError("No valid URLs provided")

    url_to_id = {}
    nodes = []
    edges = []
    
    # Add initial URLs
    for url in clean_urls:
        url_id = generate_node_id(url)
        url_to_id[url] = url_id
        nodes.append({
            "id": url_id,
            "label": generate_label(url),
            "url": url,
            "analysis": "Link analysis pending"
        })
    connector = aiohttp.TCPConnector(ssl=False)

    async with ClientSession(headers=headers, connector=connector) as session:
        results_queue = asyncio.Queue()
        consumer = asyncio.create_task(
            process_results(results_queue, url_to_id, nodes, edges, args.unique)
        )

        semaphore = asyncio.Semaphore(args.threads)
        crawlers = []

        for url in clean_urls:
            task = asyncio.create_task(
                asyncio.wait_for(
                    crawl(url, results_queue, semaphore, session, args, url_to_id, nodes, edges),
                    timeout=args.timeout if args.timeout > 0 else None
                )
            )
            crawlers.append(task)

        try:
            await asyncio.gather(*crawlers)
        except:
            pass
        finally:
            await results_queue.join()
            consumer.cancel()
            try:
                await consumer
            except asyncio.CancelledError:
                pass

    return {
        "nodes": nodes,
        "edges": edges
    }
