# Jorjin RAG 部署與官方更新手冊

## 範圍與目前基準

本文件管理 Jorjin Web UI 發布，以及保留自訂 UI 的官方後端更新流程。
文件與發布檔案的存在不代表已部署；部署必須另外安排維護時段並取得確認。

已部署版本及實際回復命令見 [2026-09-18 發布紀錄](jorjin-release-20260918.md)。
目前固定發布選擇保存在 `docker/jorjin-release.env`；下表為改版前檢查基準。

2026-09-18 檢查到的環境（操作前必須重新確認）：

| 項目 | 值 |
| --- | --- |
| 專案根目錄 | `/home/jack/work/Jorjin_AI_API_middleware/Github/ragflow` |
| Git 分支 | `docling_enable` |
| origin | `https://github.com/kzger/jorjin-ragflow-latest.git`，公司 fork |
| upstream | `https://github.com/infiniflow/ragflow.git`，官方 |
| Compose project / service | `docker` / `ragflow-cpu` |
| 現有容器 | `docker-ragflow-cpu-1` |
| 現有映像 | `jorjin-ragflow:docling-enable-v0.27.2` |
| 後端 | Python API 9380、管理 API 9381 |
| 正式 HTTP 入口 | `http://192.168.40.197:9702` |
| 開發預覽 | `http://192.168.40.197:5175`，不是正式服務 |

目前 Nginx 從 `/ragflow/web/dist` 提供前端，並代理 `/api`、`/v1` 到 Python。
本次發布只替換靜態前端，不更新後端程式、資料庫結構或資料卷。
既有容器亦掛載本機 `entrypoint.sh` 與 `service_conf.yaml.template`；
只記錄映像不足以重現部署，還必須安全保存這些設定及其版本。

## 一、發布前準備

1. 將 UI 與發布檔案做成可追溯的 Git commit，確認無待納入的變更。
   不要使用未審查的 `git add .`；不得提交 `.env`、`.env.save`、帳密或執行資料。
2. 確認真實後端驗收：登入／登出、文件上傳與解析、檢索、聊天串流、管理員頁面。
   使用核准的測試帳號及資料集；接正式資料庫的預覽也會寫入真實資料。
3. 安排維護時段，等待或暫停新任務，避免重建應用容器中斷執行中的解析／聊天。
4. 保存目前映像、Compose 設定及掛載檔；依現有備份制度備份資料庫與文件儲存，確認可還原。
   備份包含敏感資訊，必須放在存取受控、非 Git 的位置。
5. 不要在部署期間執行 upstream 合併。不要執行 `docker compose down -v` 或清理資料卷。

以下命令都從專案根目錄執行。範例標籤每次發布必須換新，不覆寫舊版。

```bash
git status --short
git rev-parse HEAD
docker inspect docker-ragflow-cpu-1 --format '{{.Image}}'
docker inspect docker-ragflow-cpu-1 --format '{{index .Config.Labels "com.docker.compose.project"}}'
```

安全記錄部署前的實際映像 ID，而不只記錄可能被改寫的標籤：

```bash
export JORJIN_BASE_ID=$(docker inspect docker-ragflow-cpu-1 --format '{{.Image}}')
docker image tag "$JORJIN_BASE_ID" jorjin-ragflow:rollback-before-ui-v1
export JORJIN_BASE_IMAGE=jorjin-ragflow:rollback-before-ui-v1
export JORJIN_RELEASE_IMAGE=jorjin-ragflow:jorjin-ui-v1
```

這個 rollback 標籤只建立一次；後續發布請使用新的名稱。
以專用標籤固定這台主機的基底，並記錄其映像 ID；不要直接將 `sha256:映像ID` 傳給 Dockerfile 的 FROM，
BuildKit 可能將它解析為 registry 映像名稱。跨主機發布應使用受控 registry 的 `名稱@sha256:digest`，或保存／載入映像。

## 二、建置前端與發布映像

以 Node.js 24 LTS 與 lockfile 安裝依賴。首次驗證環境為 Node 24.20.0 / npm 11.19.0；
每次發布記錄實際工具版本。`VITE_*` 是瀏覽器可見設定，不能放密鑰。

```bash
(cd web && npm ci --no-audit --no-fund)
(cd web && npx jest --runInBand --coverage=false src/pages/login-next/index.test.tsx src/components/theme-provider.test.tsx src/locales/config.test.ts src/pages/next-search/llm-setting-defaults.test.ts)
(cd web && npm run type-check)
(cd web && npm run build)
```

每一步都檢查結果，失敗就停止並處理；不要盲目貼上整段繼續發布。
初次 UI 改版驗證時 type-check 有 214 項既存診斷，與修改前基準相同，**不是型別檢查通過**。
後續發布需另行比對基準、確認無新增問題並記錄接受例外的決定，不能永久忽略所有型別錯誤。

建置正式映像（確認 `web/dist` 是本次建置產物、沒有手動加入其他資料）：

```bash
docker build --pull=false \
  --build-arg BASE_IMAGE="$JORJIN_BASE_IMAGE" \
  --build-arg WEB_REVISION="$(git rev-parse HEAD)" \
  -f docker/Dockerfile.jorjin-ui \
  -t "$JORJIN_RELEASE_IMAGE" web/dist
docker image inspect "$JORJIN_RELEASE_IMAGE" --format '{{.Id}}'
```

Dockerfile 刻意以 `web/dist` 為 context，不會傳入整份 repository 或 Docker `.env`。
它會移除映像內的舊前端目錄，再放入新版；不刪除主機檔案，也不碰資料卷。
後端、ENTRYPOINT、啟動參數及 Nginx 設定繼承自基底映像。
正式代理由 Nginx 決定；Vite 的 `API_PROXY_SCHEME` 只控制開發預覽，不會替你設定正式 Nginx。

## 三、正式切換（需另外確認後執行）

本 override 僅支援目前 `ragflow-cpu` 部署，不要直接套到 GPU 或 Go 部署。
使用原本 project 名稱與 `.env`，避免建立另一套資料卷／服務。
完整 `docker compose config` 可能展開密鑰，因此只用 `--quiet` 驗證，勿貼出完整輸出。

```bash
docker compose -p docker --env-file docker/.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu config --quiet
```

確認備份、驗收與維護時段後才執行：

```bash
docker compose -p docker --env-file docker/.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu up -d --no-deps --pull never ragflow-cpu
```

此命令會重建應用容器，短暫中斷 API／背景任務，但不主動重建 MySQL、Redis 或儲存服務。
新版本仍由 `9702` 提供，不是 `5175`。不要同時啟動另一個完整後端對正式資料庫驗收，
因為它可能啟動 workers 或初始化程序；整套預備環境應使用隔離的資料庫與儲存。

切換後等待服務啟動並驗證：

```bash
docker compose -p docker --env-file docker/.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu ps ragflow-cpu
curl --fail --silent --show-error http://127.0.0.1:9702/api/v1/system/config
curl --fail --silent --show-error http://127.0.0.1:9702/api/v1/auth/login/channels
curl --fail --silent --show-error -o /dev/null http://127.0.0.1:9702/jorjin-rag-logo.png
```

HTTP 200 之外也要確認 JSON 的 `code` 為 0。透過外部瀏覽器強制重新整理，
驗證登入／登出、雙語、側欄、深淺色、文件解析、檢索、聊天串流及管理員功能。
失敗時查閱應用日誌但不要公開 token、帳密或使用者資料。

確認正式入口正常後再停止開發預覽，並關閉不再需要的開發連接埠。
對公網使用 HTTPS；依實際拓樸限制資料庫、儲存及後端連接埠，不因本次 UI 發布自動改防火牆。

往後重建此服務都必須帶上 Jorjin override 與發布映像變數；只執行原 Compose
可能恢復 `.env` 指定的舊映像。將確定的映像標籤／digest 納入受控的部署設定。

## 四、回復上一版

```bash
export JORJIN_RELEASE_IMAGE=jorjin-ragflow:rollback-before-ui-v1
docker compose -p docker --env-file docker/.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu up -d --no-deps --pull never ragflow-cpu
```

重新執行 API 與登入驗收。回復映像不會撤銷新建帳號、文件或其他資料寫入。
若同時更動過掛載設定，也要恢復配套版本；若是後端升級且涉及 schema migration，
必須使用該次升級專屬的資料還原方案，不能假設換回映像即可。

## 五、同步 upstream，保留 Jorjin Web UI

### 分支與邊界

- `origin` 是公司 fork；`upstream` 才是官方。
- 以目前 Jorjin 分支建立整合分支，驗證後才合併回公司主線；不直接在正式 checkout 合併。
- 官方更新先選定 tag 或 commit，閱讀變更與 migration 說明，不自動追最新主線部署。
- `web/` 預設保留 Jorjin 版本，但必要的 API／安全修正需另行移植。
- 後端 Docling 等自訂修改、`docker/Dockerfile.jorjin-ui`、
  `docker/docker-compose.jorjin.yml`、本文件與根目錄 Logo 都需逐一審查，不以官方版本整批覆蓋。

### 操作流程

先把必要修改提交；有未提交或未追蹤檔案時，先分類保存，不自動 stash 或刪除。
建議在獨立 clone／worktree 操作，避免變更正式掛載中的 `docker/entrypoint.sh` 等檔案。

以下是範例，先替換分支名稱與 upstream 版本：

```bash
git status --short
git remote -v
git fetch upstream --tags
git switch -c integration/upstream-YYYYMMDD
export JORJIN_PRE_SYNC=$(git rev-parse HEAD)
export JORJIN_UPSTREAM_TARGET='填入已審核的官方-tag-或-commit'
git rev-parse --verify "$JORJIN_UPSTREAM_TARGET^{commit}"
git merge --no-ff --no-commit "$JORJIN_UPSTREAM_TARGET"
```

若 merge 回報衝突，停下來檢視，不要把失敗當成可忽略。
確認 merge 確實進行中後，明確恢復整個前端，而非只選衝突行：

```bash
git rev-parse --verify MERGE_HEAD
git restore --source="$JORJIN_PRE_SYNC" --staged --worktree -- web/
git diff --name-only --diff-filter=U
git diff --cached --stat
git diff --cached "$JORJIN_PRE_SYNC" -- web/
```

最後一個命令應無輸出：包含官方新增、刪除及未衝突的前端變更，都應被排除。
若 merge 顯示已是最新、沒有 `MERGE_HEAD`，就不執行這段恢復操作。
處理剩餘後端衝突，逐檔 `git add`；確認沒有 unresolved files，再跑測試並完成 merge commit。
merge 保留官方歷史，不要用 squash 取代此固定同步流程。

不可使用：

- `git merge -s ours`：會忽略整份官方內容，不只是 Web UI。
- `git merge -X ours` 作為前端排除機制：它只偏向解決衝突，仍會接受未衝突的前端更新。
- `.gitignore` 作為追蹤檔案的合併保護：它無法排除已追蹤的 `web/` 更新。

### 同步後驗收與版本配對

1. 審查登入／註冊、上傳、檢索、聊天 SSE、管理 API 的契約變更。
2. 比對官方前端對應修改，將必要協定及安全修正以獨立 commit 移植，不重引入官方品牌或語言。
   本流程已在 merge 中刻意捨棄官方前端變更，未來 Git 不會自動補回。
3. 先跑受影響後端測試，再做隔離環境的完整整合驗收；Go 測試依專案規範使用 `build.sh`。
4. 若升級後端，先建置並驗證新的 Jorjin 後端基底映像，再以上述 UI Dockerfile 包裝。
   只換 Git 原始碼、仍使用舊基底映像，不會更新容器內後端。
5. 發布記錄包含 upstream commit、Jorjin commit、UI commit、基底與發布映像 ID／digest、
   Node/npm 版本、掛載設定版本、測試結果、已知例外、備份位置、回復版本與維護時間。
6. 完成審查後才推送公司 fork、建立發布標籤並安排部署；不向 upstream 推送公司修改。

## 六、開發預覽與正式部署的差異

```bash
cd web
API_PROXY_SCHEME=python npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

此命令只啟動開發預覽，代理本機 Python 後端；不是部署命令，也沒有模擬資料隔離。
服務會使用既有資料庫；勿將 Vite 開發伺服器直接暴露到公網。

## 參考

- [Docker：正式環境 Compose](https://docs.docker.com/compose/how-tos/production/)
- [Docker：合併 Compose 設定](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/)
- [Git：merge 行為與策略](https://git-scm.com/docs/git-merge)
