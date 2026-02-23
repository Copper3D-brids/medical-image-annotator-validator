# Plugin 动态路由方案

## 背景

本项目（medical-image-annotator）最终会编译为 UMD library，作为 plugin 插入主应用。
主应用后端基于 FastAPI，跑在 8000 端口，部署后不再改动。
Plugin 自身有独立后端，端口由主应用动态分配。
未来会有多个 plugin，每个都有独立 backend，需要动态接入路由，不能每次都改 Nginx 配置。

---

## 方案 A：Traefik 动态反向代理（推荐）

### 原理

Traefik 监听 Docker socket，当新容器启动时自动读取 label 更新路由，无需重启或修改配置文件。

### 流量路径

```
用户浏览器
    ↓
  Traefik（监听 Docker，动态路由）
    ├── /                      → 主应用 frontend
    ├── /api/                  → 主应用 backend (8000)
    ├── /plugin/annotator/     → annotator backend (8082)
    └── /plugin/xxx/           → 未来新 plugin backend（自动接入）
```

### 主应用 docker-compose.yml（一次性配置，之后不动）

```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  main-backend:
    image: main-app-backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.main-api.rule=PathPrefix(`/api`)"
```

### Plugin 自己的 docker-compose.yml（添加 plugin 时只需 up 这个）

```yaml
services:
  annotator-backend:
    image: annotator-backend
    networks:
      - main-network        # 接入主应用的同一个 Docker network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.annotator.rule=PathPrefix(`/plugin/annotator`)"
      - "traefik.http.middlewares.annotator-strip.stripprefix.prefixes=/plugin/annotator"
      - "traefik.http.routers.annotator.middlewares=annotator-strip"

networks:
  main-network:
    external: true    # 引用主应用已创建的 network
```

### Plugin 前端 client.ts

```ts
// 直接用相对路径，跟着主应用走
const base_url = '/plugin/annotator'
```

### 添加新 plugin 的流程

1. 编写 plugin 的 docker-compose.yml，配好 Traefik label
2. `docker-compose up -d`
3. Traefik 自动感知，路由生效，主应用零改动

### 优缺点

- **优点**：主应用零改动；plugin 完全自治；原生支持 WebSocket；性能好（直接转发）
- **缺点**：多引入一个基础设施组件（Traefik）

---

## 方案 B：主应用 FastAPI 动态代理路由

### 原理

主应用 FastAPI 内置一个 Plugin Registry + 通用代理端点。Plugin backend 启动时主动注册自己的地址，
主应用根据注册信息动态代理请求，不需要 Nginx 或 Traefik。

### 主应用预留的端点（一次性写好）

```python
# 主应用 main.py
import httpx
from fastapi import Request, Response

plugin_registry: dict[str, str] = {}  # plugin_id → internal URL（也可存 DB）

# Plugin 启动时主动注册自己
@app.post("/system/plugin/register")
async def register_plugin(plugin_id: str, internal_url: str):
    plugin_registry[plugin_id] = internal_url

# 通用代理端点
@app.api_route("/plugin/{plugin_id}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_to_plugin(plugin_id: str, path: str, request: Request):
    target = plugin_registry.get(plugin_id)
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method=request.method,
            url=f"{target}/{path}",
            content=await request.body(),
            headers=dict(request.headers),
        )
    return Response(resp.content, resp.status_code)
```

### Plugin backend 启动时自注册

```python
# annotator-backend 启动时
import httpx

async def on_startup():
    await httpx.AsyncClient().post(
        "http://main-backend:8000/system/plugin/register",
        params={"plugin_id": "annotator", "internal_url": "http://annotator-backend:8082"}
    )
```

### Plugin 前端 client.ts

```ts
const base_url = '/plugin/annotator'   // 同方案 A，相对路径
```

### 优缺点

- **优点**：纯应用层，无额外基础设施；plugin 启动时自注册
- **缺点**：主应用需预留注册+代理端点（需提前规划好接口）；WebSocket 需额外处理；多一跳，性能略低

---

## 方案对比

| | Traefik | FastAPI 动态代理 |
|---|---|---|
| 主应用改动 | 零改动 | 需预留注册 + 代理端点 |
| 新增 plugin | `docker up` 即可 | plugin 启动时自注册 |
| WebSocket 支持 | 原生支持 | 需额外处理 |
| 额外组件 | Traefik | 无 |
| 性能 | 更好（直接转发） | 多一跳 |
| 适合场景 | Docker 部署为主 | 对基础设施有限制时 |

---

## 建议

- **Docker 部署环境**：优先选方案 A（Traefik），plugin 自带 label，`docker up` 即接入，主应用完全不感知。
- **有基础设施限制**（如 K8s、公司统一网关）：选方案 B，关键是主应用**提前预留通用代理入口**。
