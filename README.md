# 多人共享库存抽奖（Vercel + KV）

一个**打开即用**、支持**多人同时抽奖**的前端小程序，库存与中奖记录**共享保存在云端**。

- 前端：纯静态 `public/index.html`（无框架）
- 后端：Vercel Serverless API（`/api`），使用 **Vercel KV** 作为共享存储（原子扣减）
- 管理：`public/admin.html`（需管理员 Token）

## 一键部署步骤（建议 5 分钟内搞定）

1. **注册/登录 Vercel**：<https://vercel.com>
2. **创建 KV 数据库**：在 Vercel → **Storage → KV** 新建一个实例，然后回到项目的 **Settings → Environment Variables**，点击 **"Connect Store"** 一键注入 KV 环境变量。
3. **设置管理员 Token（自定义）**：在项目的环境变量里新增：  
   - `ADMIN_TOKEN` = 你自定义的一串密钥（例如 `my-secret-token`）。
4. **导入本项目并部署**：  
   - 将本项目上传到 GitHub/GitLab，然后在 Vercel 上 **Import Project**；或直接使用 Vercel CLI `vercel` 部署。
5. **访问**：  
   - 抽奖页：`https://你的域名/`  
   - 后台页：`https://你的域名/admin.html`（首次进入在顶部输入 `ADMIN_TOKEN`）

> 首次访问时，会自动写入**默认奖品**。你也可以在后台页粘贴你的奖品 JSON 并保存。

## 奖品 JSON 结构

```json
[
  { "id": "可省略将自动生成", "name": "一等奖", "weight": 1, "qty": 1, "img": "https://..." },
  { "name": "安慰奖", "weight": 6, "qty": -1, "img": "data:image/png;base64,..." }
]
```

- `weight`：权重，越大越容易中。
- `qty`：数量；`-1` 表示不限量，`>=0` 表示有限库存（共享扣减）。
- `img`：图片 URL 或 `data:` 开头的 base64。

## API（部署后自动生效）

- `GET /api/prizes` → `{ prizes, records }`
- `POST /api/draw` → `{ prize }`（原子扣减，有并发保护）
- `POST /api/admin-reset?token=ADMIN_TOKEN` → 恢复默认奖品
- `POST /api/admin-set-prizes?token=ADMIN_TOKEN` → 设置奖品，Body: `{ prizes: [...] }`

## 注意事项

- 扣减使用 KV 的 `DECR` 保证**原子性**：如果两个用户同时抽中最后一件，只有**一个**会成功扣减，另一个会自动重试并选择其他奖品或落入不限量奖。
- 共享库存是以**云端**为准，前端会在抽奖结束后**自动刷新库存**。
- 如果需要**分活动场次**，建议在 KV key 前加命名空间（例如 `event:2025-q4:`），或在代码里增加 `EVENT_ID`。

祝使用顺利！如果你想要**品牌化主题/二维码生成/多场次/防刷**（手机号或邀请码限制），可以继续找我扩展。

