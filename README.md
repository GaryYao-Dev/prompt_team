# Promotion Team - AI 智能邮件营销系统

一个使用 LangGraph 的多智能体 AI 系统，可自动生成并发送个性化促销邮件。该系统使用多个 AI 智能体（管理者、销售人员、评估者）协同工作，创建高质量的营销内容。

## 目录

- [前置要求](#前置要求)
- [安装指南](#安装指南)
  - [步骤 1：验证 winget（Windows 包管理器）](#步骤-1验证-wingetwindows-包管理器)
  - [步骤 2：安装 Node.js 版本管理器（nvm）](#步骤-2安装-nodejs-版本管理器nvm)
  - [步骤 3：安装 Node.js](#步骤-3安装-nodejs)
  - [步骤 4：安装 pnpm](#步骤-4安装-pnpm)
- [项目设置](#项目设置)
- [配置](#配置)
- [运行应用程序](#运行应用程序)
- [测试 AI API](#测试-ai-api)
- [项目结构](#项目结构)
- [故障排除](#故障排除)

---

## 前置要求

本指南假设您从一个全新的 Windows 系统开始。您需要：

- 一台运行 Windows 10/11 的计算机
- 管理员权限
- 互联网连接
- PowerShell 或命令提示符（Windows 自带）

---

## 安装指南

### 步骤 1：验证 winget（Windows 包管理器）

winget 是 Windows 11 和 Windows 10（1809 及更高版本）自带的官方包管理器。

1. **以管理员身份**打开 PowerShell：
   - 按 `Windows 键`，输入 "PowerShell"
   - 右键点击 "Windows PowerShell"
   - 选择 "以管理员身份运行"

2. 验证 winget 是否可用：

```powershell
winget --version
```

您应该看到类似这样的输出：`v1.x.x`

**如果 winget 不可用：**

- Windows 11：已预装，如果没有请更新系统
- Windows 10：从 Microsoft Store 安装 [应用安装程序](https://www.microsoft.com/p/app-installer/9nblggh4nns1)

---

### 步骤 2：安装 Node.js 版本管理器（nvm）

nvm 允许您安装和管理不同版本的 Node.js。

1. 使用 winget 安装 nvm-windows：

```powershell
winget install CoreyButler.NVMforWindows
```

2. 安装完成后，关闭 PowerShell 窗口，然后**重新以管理员身份打开**一个新的 PowerShell 窗口。

3. 验证 nvm 是否安装成功：

```powershell
nvm version
```

您应该看到版本号，例如 `1.1.x`

---

### 步骤 3：安装 Node.js

Node.js 是运行此项目所需的运行时环境。

1. 安装最新的 LTS（长期支持）版本的 Node.js：

```powershell
nvm install lts
```

2. 将此版本设置为默认版本：

```powershell
nvm use lts
```

3. 验证 Node.js 和 npm 是否安装成功：

```powershell
node --version
npm --version
```

您应该看到版本号（例如 `v20.x.x` 和 `10.x.x`）

---

### 步骤 4：安装 pnpm

pnpm 是一个快速、节省磁盘空间的包管理器（比 npm 更适合 monorepo 项目）。

1. 全局安装 pnpm：

```powershell
npm install -g pnpm
```

2. 验证 pnpm 是否安装成功：

```powershell
pnpm --version
```

您应该看到版本号，例如 `9.x.x`

---

## 项目设置

现在所有工具都已安装完成，让我们设置项目。

### 1. 导航到项目目录

打开 PowerShell（不需要管理员权限），进入项目文件夹：

```powershell
cd C:\path\to\promotion_team
```

**注意**：将 `C:\path\to\promotion_team` 替换为您的实际项目路径。

### 2. 安装项目依赖

这将安装整个项目所需的所有包（需要 2-5 分钟）：

```powershell
pnpm install
```

等待安装完成。完成后您会看到摘要信息。

### 3. 构建共享包

构建共享的 TypeScript 包：

```powershell
pnpm build:types
pnpm build:utils
```

### 4. 配置环境变量

1. 进入 API 目录：

```powershell
cd apps\api
```

2. 复制示例环境文件：

```powershell
copy .env.example .env
```

3. 使用记事本打开 `.env` 文件：

```powershell
notepad .env
```

4. **必填配置**：填写以下值：
   - **`OPENAI_API_KEY`**：您的 OpenAI API 密钥（从 https://platform.openai.com/api-keys 获取）

   或者，您也可以使用：
   - **`ANTHROPIC_API_KEY`**：用于 Claude 模型（https://console.anthropic.com/）
   - **`GOOGLE_API_KEY`**：用于 Google 模型（https://ai.google.dev/）

   - **`SMTP_USER`**：您的 Gmail 地址（例如 `yourname@gmail.com`）
   - **`SMTP_PASS`**：Gmail 应用专用密码（请参见下面的说明）
   - **`EMAIL_FROM`**：发件人名称和邮箱（例如 `"您的商店 <yourname@gmail.com>"`）

5. **如何获取 Gmail 应用专用密码**：
   - 访问 https://myaccount.google.com/apppasswords
   - 使用您的 Gmail 账户登录
   - 点击"创建"并给它命名（例如"Promotion Team"）
   - 复制 16 位密码并粘贴到 `SMTP_PASS` 中

6. 保存并关闭文件

7. 返回项目根目录：

```powershell
cd ..\..
```

---

## 运行应用程序

### 启动开发环境

在项目根目录下运行：

```powershell
pnpm dev
```

此命令将：

- 在 http://localhost:8001 上启动 API 服务器
- 在 http://localhost:5173 上启动 Web 应用程序（如果已配置）

您应该看到类似这样的输出：

```
[api] API server running on port 8001
[api] Environment: development
[web] Local: http://localhost:5173/
```

**保持此 PowerShell 窗口打开** - 它正在运行您的应用程序。

要停止服务器，请在 PowerShell 中按 `Ctrl + C`。

---

## 测试 AI API

开发服务器运行后，您可以测试 AI 促销系统。

### 方式 1：使用 curl（命令行）

1. 打开一个**新的 PowerShell 窗口**（第一个窗口正在运行服务器）

2. 进入项目目录：

```powershell
cd C:\path\to\promotion_team
```

3. 运行此测试命令：

```powershell
curl.exe -X POST http://localhost:8001/api/ai/promotion `
  -H "Content-Type: application/json" `
  -d '{
    \"product\": {
      \"id\": \"APE-tshirt-1\",
      \"name\": \"高级纯棉T恤\",
      \"description\": \"舒适的100%有机棉T恤，现代版型\",
      \"price\": 29.99,
      \"originalPrice\": 49.99,
      \"discount\": 40,
      \"category\": \"服装\",
      \"imageUrl\": \"https://example.com/tshirt.jpg\",
      \"features\": [\"100%有机棉\", \"现代版型\", \"透气面料\"]
    },
    \"customerEmails\": [\"test@example.com\"],
    \"similarProducts\": [
      {
        \"id\": \"APE-tshirt-2\",
        \"name\": \"经典纯棉T恤\",
        \"price\": 24.99,
        \"originalPrice\": 39.99,
        \"discount\": 37,
        \"imageUrl\": \"https://example.com/tshirt2.jpg\"
      }
    ]
  }'
```

### 方式 2：使用 Postman 或 Insomnia

1. 下载并安装 [Postman](https://www.postman.com/downloads/) 或 [Insomnia](https://insomnia.rest/download)

2. 创建一个新的 POST 请求

3. 设置 URL 为：`http://localhost:8001/api/ai/promotion`

4. 设置请求头：
   - Key：`Content-Type`
   - Value：`application/json`

5. 设置请求体（原始 JSON）：

```json
{
  "product": {
    "id": "APE-tshirt-1",
    "name": "高级纯棉T恤",
    "description": "舒适的100%有机棉T恤，现代版型",
    "price": 29.99,
    "originalPrice": 49.99,
    "discount": 40,
    "category": "服装",
    "imageUrl": "https://example.com/tshirt.jpg",
    "features": ["100%有机棉", "现代版型", "透气面料"]
  },
  "customerEmails": ["your-email@example.com"],
  "similarProducts": [
    {
      "id": "APE-tshirt-2",
      "name": "经典纯棉T恤",
      "price": 24.99,
      "originalPrice": 39.99,
      "discount": 37,
      "imageUrl": "https://example.com/tshirt2.jpg"
    }
  ]
}
```

6. 点击 **发送**

### 接下来会发生什么？

AI 系统将：

1. 创建营销策略（5-10 秒）
2. 并行生成两份不同的邮件草稿（20-30 秒）
3. 评估并选择最佳草稿（10-15 秒）
4. 转换为 HTML 格式（5 秒）
5. 审核准确性（5-10 秒）
6. 将邮件发送到指定地址

**总耗时**：约 1-2 分钟

### 预期响应

```json
{
  "success": true,
  "message": "促销邮件生成并发送成功",
  "data": {
    "htmlContent": "<html>...</html>",
    "sentCount": 1,
    "selectedStyle": "emotional",
    "iterations": 1
  }
}
```

### 查看输出

生成的文件保存在：

```
apps\api\src\services\ai\output\高级纯棉T恤_[时间戳]\
```

您可以查看它们：

```powershell
dir apps\api\src\services\ai\output\
```

打开最新的文件夹查看：

- `draft_salesperson-rational_rational.md` - 理性风格草稿
- `draft_salesperson-emotional_emotional.md` - 情感风格草稿
- `email_draft_v1.html` - 最终 HTML 邮件
- `final_email.html` - 已发送的邮件

---

## 项目结构

```
promotion_team/
├── apps/
│   ├── api/                    # 后端 API 服务器
│   │   ├── src/
│   │   │   ├── services/ai/    # AI 多智能体系统
│   │   │   │   ├── agents/     # 管理者、销售人员、评估者
│   │   │   │   ├── graph/      # LangGraph 工作流
│   │   │   │   ├── tools/      # 邮件、markdown、数据库工具
│   │   │   │   └── output/     # 生成的邮件（git忽略）
│   │   │   ├── routes/         # API 端点
│   │   │   └── config/         # 配置文件
│   │   └── .env                # 环境变量（您需要创建）
│   │
│   └── web/                    # 前端 Web 应用程序（可选）
│
├── packages/
│   ├── types/                  # 共享 TypeScript 类型
│   └── utils/                  # 共享工具函数
│
├── package.json                # 根包配置
├── pnpm-workspace.yaml         # Monorepo 工作区配置
└── README.md                   # 本文件
```

---

## 故障排除

### 问题：“端口 8001 已被占用”

**解决方案：**

```powershell
# 查找占用端口的程序
netstat -ano | findstr :8001

# 结束进程（将 PID 替换为显示的数字）
taskkill /PID <PID> /F

# 或在 apps\api\.env 中更改端口
# API_PORT=8002
```

### 问题："OpenAI API 密钥无效"

**解决方案：**

1. 检查您的 `.env` 文件：`type apps\api\.env | findstr OPENAI`
2. 在 https://platform.openai.com/api-keys 验证密钥
3. 确保没有多余的空格或引号
4. 更新后重启服务器

### 问题："邮件发送失败"

**解决方案：**

1. 验证 `.env` 中的 Gmail 应用专用密码是否正确
2. 检查您的 Google 账户是否启用了两步验证
3. 尝试使用不同的邮箱地址
4. 检查收件人的垃圾邮件文件夹

### 问题："找不到 pnpm 命令"

**解决方案：**

```powershell
# 重新安装 pnpm
npm install -g pnpm

# 或使用 npx
npx pnpm install
```

### 问题："找不到模块"错误

**解决方案：**

```powershell
# 清理安装
Remove-Item -Recurse -Force node_modules, apps\*\node_modules, packages\*\node_modules
pnpm install

# 重新构建共享包
pnpm build:types
pnpm build:utils
```

### 问题："PowerShell 执行策略错误"

**解决方案：**

```powershell
# 以管理员身份运行 PowerShell，然后执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 获取更多帮助

- 检查 PowerShell 输出中的错误消息
- 查看 `apps\api\src\services\ai\output\` 中的生成文件
- 查阅 API 文档：`apps\api\src\services\ai\README.md`

---

## 其他命令

### 仅运行 API 服务器

```powershell
cd apps\api
pnpm dev
```

### 仅运行 Web 应用

```powershell
cd apps\web
pnpm dev
```

### 生产构建

```powershell
pnpm build
```

### 代码检查

```powershell
pnpm lint
```

### 代码格式化

```powershell
pnpm format
```

---

## 下一步

1. ✅ 完成上述安装步骤
2. ✅ 使用 API 密钥配置您的 `.env` 文件
3. ✅ 启动开发服务器
4. ✅ 测试 AI API 端点
5. 📖 阅读 AI 服务文档：`apps\api\src\services\ai\README.md`
6. 🚀 自定义 `apps\api\src\services\ai\data\products.json` 中的产品数据
7. 🎨 修改 `apps\api\src\services\ai\prompts\` 中的智能体提示词

---

## 技术支持

遇到技术问题时，请检查：

- PowerShell 错误消息
- 运行 `pnpm dev` 的 PowerShell 中的 API 日志

---

## 许可证

[在此处填写您的许可证]
