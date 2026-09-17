# RAGFlow v0.26.4 — NVIDIA DGX Spark ARM64 Source Build Guide

本文件說明如何在 **NVIDIA DGX Spark / ARM64 (`aarch64`)** 環境中，從 RAGFlow source code 建立 ARM64 Docker image。

## 1. 環境說明

目標環境：

| 項目 | 設定 |
|---|---|
| Hardware | NVIDIA DGX Spark |
| CPU Architecture | ARM64 / `aarch64` |
| OS | Ubuntu Linux |
| Docker Platform | `linux/arm64` |
| RAGFlow | `v0.26.4` |
| Build Method | Build from source |
| RAGFlow Image | `infiniflow/ragflow:v0.26.4-arm64` |

RAGFlow 官方提供的 `v0.26.4` image 為 AMD64，因此不能直接作為 DGX Spark 的 native image 使用。

確認：

```bash
uname -m
```

預期：

```text
aarch64
```

如果已經下載官方 RAGFlow image，也可以確認其架構：

```bash
docker image inspect infiniflow/ragflow:v0.26.4 \
  --format '{{.Architecture}}/{{.Os}}'
```

官方 image 預期會顯示：

```text
amd64/linux
```

因此需要自行建立：

```text
linux/arm64
```

版本。

---

## 2. 進入 RAGFlow Source Code

假設 repository 位於：

```text
~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow
```

進入 repository：

```bash
cd ~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow
```

確認目前狀態：

```bash
git status
```

如果有尚未 commit 的修改，建議先處理或保存：

```bash
git diff
```

---

## 3. Checkout RAGFlow v0.26.4

為避免 Dockerfile、entrypoint、Compose configuration 與 RAGFlow source code 版本不一致，建議固定使用相同版本：

```bash
git checkout v0.26.4
```

確認：

```bash
git describe --tags --always
```

預期：

```text
v0.26.4
```

---

## 4. 確認 ARM64 環境

確認 Host：

```bash
uname -m
```

預期：

```text
aarch64
```

確認 Docker：

```bash
docker info | grep -i Architecture
```

預期類似：

```text
Architecture: aarch64
```

確認 Buildx：

```bash
docker buildx version
docker buildx ls
```

由於 DGX Spark 本身就是 ARM64，因此：

```text
Host   : linux/arm64
Target : linux/arm64
```

屬於 native build，不需要使用 QEMU cross compilation。

---

## 5. 確認 `uv`

RAGFlow dependency preparation 會使用 `uv`。

確認：

```bash
uv --version
```

如果尚未安裝：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

重新載入 shell：

```bash
source ~/.bashrc
```

確認：

```bash
uv --version
```

---

# 6. 準備 RAGFlow Dependencies

進入：

```bash
cd ~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow/ragflow_deps
```

執行：

```bash
uv run python3 download_deps.py
```

這個步驟會下載建立 RAGFlow Docker image 所需要的 dependencies。

完成後可以檢查：

```bash
ls -lah
```

以及：

```bash
du -sh .
```

---

# 7. Build ARM64 `ragflow_deps`

在：

```text
ragflow/ragflow_deps/
```

執行：

```bash
docker build \
  --platform linux/arm64 \
  -f Dockerfile \
  -t infiniflow/ragflow_deps:latest \
  .
```

雖然 DGX Spark 本身已經是 ARM64，仍建議明確指定：

```text
--platform linux/arm64
```

避免 Docker default platform 或 Buildx configuration 造成架構混淆。

---

## 8. 驗證 `ragflow_deps`

Build 完成後：

```bash
docker image inspect infiniflow/ragflow_deps:latest \
  --format '{{.Architecture}}/{{.Os}}'
```

正確結果：

```text
arm64/linux
```

如果顯示：

```text
amd64/linux
```

則不要繼續建立 RAGFlow image，應先檢查 `ragflow_deps` build configuration。

---

# 9. Build RAGFlow ARM64 Image

回到 RAGFlow repository root：

```bash
cd ~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow
```

執行：

```bash
docker build \
  --platform linux/arm64 \
  -f Dockerfile \
  -t infiniflow/ragflow:v0.26.4-arm64 \
  .
```

這個過程可能需要一段時間。

最後建立：

```text
infiniflow/ragflow:v0.26.4-arm64
```

---

# 10. 驗證 RAGFlow Image Architecture

Build 完成後：

```bash
docker image inspect infiniflow/ragflow:v0.26.4-arm64 \
  --format '{{.Architecture}}/{{.Os}}'
```

正確結果：

```text
arm64/linux
```

可以同時查看所有 RAGFlow images：

```bash
docker images | grep ragflow
```

可能看到：

```text
infiniflow/ragflow        v0.26.4-arm64
infiniflow/ragflow_deps   latest
infiniflow/ragflow        v0.26.4
```

其中：

```text
infiniflow/ragflow:v0.26.4
```

為官方 AMD64 image，而：

```text
infiniflow/ragflow:v0.26.4-arm64
```

為 DGX Spark 使用的 ARM64 native image。

可以分別確認：

```bash
docker image inspect infiniflow/ragflow:v0.26.4 \
  --format '{{.Architecture}}/{{.Os}}'

docker image inspect infiniflow/ragflow:v0.26.4-arm64 \
  --format '{{.Architecture}}/{{.Os}}'
```

預期：

```text
amd64/linux
arm64/linux
```

---

# 11. 修改 RAGFlow `.env`

進入 Docker configuration：

```bash
cd ~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow/docker
```

確認目前設定：

```bash
grep RAGFLOW_IMAGE .env
```

原本如果是：

```env
RAGFLOW_IMAGE=infiniflow/ragflow:v0.26.4
```

修改成：

```env
RAGFLOW_IMAGE=infiniflow/ragflow:v0.26.4-arm64
```

完成後：

```bash
grep RAGFLOW_IMAGE .env
```

確認：

```text
RAGFLOW_IMAGE=infiniflow/ragflow:v0.26.4-arm64
```

---

# 12. 停止舊 RAGFlow

如果之前已經使用 AMD64 image 建立過 RAGFlow：

```bash
docker compose down
```

> **注意：不要加入 `-v`。**

不要執行：

```bash
docker compose down -v
```

因為 `-v` 可能刪除 Compose 使用的 MySQL、Elasticsearch、Redis、MinIO 等 volumes。

一般：

```bash
docker compose down
```

只會移除 containers/network，不會刪除 persistent volumes。

---

# 13. 啟動 ARM64 RAGFlow

執行：

```bash
docker compose up -d
```

確認：

```bash
docker compose ps
```

RAGFlow 與相關 services 應正常啟動。

---

# 14. 驗證 Container 為 ARM64

先取得 RAGFlow container：

```bash
docker compose ps
```

例如：

```text
docker-ragflow-cpu-1
```

進入 container 執行：

```bash
docker exec docker-ragflow-cpu-1 uname -m
```

正確結果：

```text
aarch64
```

這表示目前：

```text
DGX Spark
    │
    │ ARM64
    ▼
Docker
    │
    │ linux/arm64
    ▼
RAGFlow
    │
    ▼
aarch64
```

整個 execution path 都是 native ARM64，不需要透過 AMD64/QEMU emulation。

---

# 15. 檢查 RAGFlow Logs

啟動後：

```bash
docker compose logs -f ragflow-cpu
```

或：

```bash
docker logs -f docker-ragflow-cpu-1
```

特別注意是否出現：

```text
exec format error
Illegal instruction
xgboost
onnxruntime
torch
opencv
numpy
unixODBC
```

如果沒有 architecture/native dependency error，而且 RAGFlow Web UI 可以正常使用，即代表 ARM64 build 基本成功。

---

# 16. OpenAI-Compatible / vLLM Provider 注意事項

如果 RAGFlow 後續連接本地 vLLM：

```text
RAGFlow
   │
   │ OpenAI-Compatible API
   ▼
vLLM
   │
   ▼
Local LLM
```

即使 vLLM 沒有設定 API Key，RAGFlow 使用的 OpenAI SDK 仍可能要求 `api_key` 不可為空。

例如出現：

```text
Missing credentials. Please pass an `api_key`...
```

這不代表 vLLM authentication 有問題。

可以在 RAGFlow Provider 設定：

```text
Provider : OpenAI-API-Compatible
API Key  : dummy
Base URL : http://<VLLM_HOST>:8000/v1
Model    : <MODEL_NAME>
```

例如：

```text
API Key: dummy
```

只要 vLLM 沒有使用 `--api-key` 啟用 authentication，就不會實際驗證這個 dummy key。

---

# 17. 完整 Build 指令

如果環境已經準備完成，可以直接依序執行：

```bash
cd ~/work/jorjin/Jorjin_AI_API_middleware/Github/ragflow

# Keep source and Docker configuration aligned
git checkout v0.26.4

# Check architecture
uname -m

# Build dependency image
cd ragflow_deps

uv run python3 download_deps.py

docker build \
  --platform linux/arm64 \
  -f Dockerfile \
  -t infiniflow/ragflow_deps:latest \
  .

docker image inspect infiniflow/ragflow_deps:latest \
  --format '{{.Architecture}}/{{.Os}}'

# Build RAGFlow
cd ..

docker build \
  --platform linux/arm64 \
  -f Dockerfile \
  -t infiniflow/ragflow:v0.26.4-arm64 \
  .

docker image inspect infiniflow/ragflow:v0.26.4-arm64 \
  --format '{{.Architecture}}/{{.Os}}'
```

兩次 architecture check 都應該得到：

```text
arm64/linux
```

接著修改：

```text
docker/.env
```

將：

```env
RAGFLOW_IMAGE=infiniflow/ragflow:v0.26.4
```

改成：

```env
RAGFLOW_IMAGE=infiniflow/ragflow:v0.26.4-arm64
```

最後：

```bash
cd docker

docker compose down

docker compose up -d

docker compose ps
```

驗證：

```bash
docker exec docker-ragflow-cpu-1 uname -m
```

應得到：

```text
aarch64
```

---

# 18. 最終架構

完成後整體架構：

```text
NVIDIA DGX Spark
ARM64 / aarch64
        │
        ▼
Docker ARM64
        │
        ├── RAGFlow v0.26.4 ARM64
        │
        ├── MySQL
        │
        ├── Redis
        │
        ├── Elasticsearch
        │
        └── MinIO
        │
        │ OpenAI-Compatible API
        ▼
      vLLM
        │
        ▼
   Local LLM / VLM
```

其中 RAGFlow 使用自行建立的：

```text
infiniflow/ragflow:v0.26.4-arm64
```

而不是官方 AMD64：

```text
infiniflow/ragflow:v0.26.4
```

這樣可以避免：

```text
The requested image's platform (linux/amd64)
does not match the detected host platform (linux/arm64/v8)
```

並讓 RAGFlow 在 NVIDIA DGX Spark 上以 **native ARM64** 方式執行。
