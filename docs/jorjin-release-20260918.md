# Jorjin RAG UI 發布：2026-09-18

## 發布識別

- 範圍：只替換 Web UI；不更新後端、不執行 upstream 同步。
- 正式入口：`http://192.168.40.197:9702/login`。
- 發布映像：`jorjin-ragflow:jorjin-ui-20260918-v1`。
- 發布映像 ID：`sha256:d337164fbaa185d59a4b130301faea554628c7f5060668a292a15d508e9193d1`。
- 回復映像：`jorjin-ragflow:rollback-before-ui-20260918-v1`。
- 基底映像 ID：`sha256:67eece6415517d918248ae00b8d560c91ed59ebeb4e011c845f447720960120e`。
- Git 基準：`fd3e7fa47f2e5ffb66c57aa734a1fceaf1e5f2f5`，分支 `docling_enable`。
- 本次發布包含未提交的 UI 修改，以受控原始碼快照識別，不將 Git HEAD 誤當作完整發布內容。
- 原始碼快照 SHA-256：`5f677e2ca479dad38e30927fc65a6fd777b38217fefcaa9b9a222d8d25274a30`。
- Node / npm：`24.20.0` / `11.19.0`。

## 備份

受限目錄：`/home/jack/work/jorjin-ragflow-release-20260918-Vda0KK`，不可提交或公開。

- `deployment-config-before.tar.gz`：原 Compose、環境設定及掛載設定。
- `source.tar.gz`：UI 與發布檔案快照，不含 node_modules、dist。
- `rag_flow.sql`：MySQL `rag_flow` 資料庫的 single-transaction 匯出。
- `minio-data/`：MinIO `/data` 檔案副本。
- `minio-tar-attempt.failed`：容器未安裝 tar 的失敗記錄，**不是備份**；有效備份為上述目錄。

備份已產生，但尚未在隔離環境做完整還原演練；此次未變更 schema，也未清理資料卷。
未備份搜尋索引／Redis，因此這不是整個系統的災難復原備份。
回復此次 UI 發布優先使用舊映像，不回寫資料庫。

## 固定發布設定與操作

`docker/jorjin-release.env` 保存非機密發布映像選擇。以下命令從 repository 根目錄執行；
shell 的 `JORJIN_RELEASE_IMAGE` 若已設定，會優先於 env 檔，操作前請確認。

```bash
docker compose -p docker \
  --env-file docker/.env --env-file docker/jorjin-release.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu up -d --no-deps --pull never ragflow-cpu
```

回復命令（會短暫中斷服務）：

```bash
JORJIN_RELEASE_IMAGE=jorjin-ragflow:rollback-before-ui-20260918-v1 \
docker compose -p docker \
  --env-file docker/.env --env-file docker/jorjin-release.env \
  -f docker/docker-compose.yml -f docker/docker-compose.jorjin.yml \
  --profile cpu up -d --no-deps --pull never ragflow-cpu
```

若決定長期停留回復版本，也須同步修改 `docker/jorjin-release.env`，避免下次又部署新版。
不要只使用原 Compose 檔重建，否則可能部署回 `.env` 的舊映像。

## 驗證與限制

- 使用者於上線後透過 Web UI 檢查，回報目前未發現問題；未逐項記錄其測試範圍。
- 已完成正式容器切換，運行映像為 `jorjin-ragflow:jorjin-ui-20260918-v1`，檢查時重啟次數為 0。
- 後端初始化期間曾短暫回傳 502，待 API 就緒後重新驗證成功。
- 透過 `192.168.40.197:9702` 驗證登入頁、註冊表單切換與管理員登入頁，瀏覽器無 JavaScript 執行錯誤。
- `/api/v1/system/config` 與 `/api/v1/auth/login/channels` 均回傳 HTTP 200、JSON `code: 0`，未使用 mock API。
- `5175` 開發預覽於上線驗證後停止；正式服務由 Docker 運行。
- 正式前端重新建置成功，4 個測試套件／15 項測試通過。
- Compose 與部署前容器的環境設定、command、掛載及連接埠比對一致。
- 已知型別檢查例外：前次比對修改前後均有 214 項既存診斷，沒有新增；不宣稱 type-check 通過。
- 未取得測試帳密，未建立真實帳號或執行文件解析／LLM 聊天；完整業務驗收仍需指定帳號及資料集。

一般部署與官方同步方式見 [操作手冊](jorjin-operations.md)。
