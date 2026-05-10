# CareerCompass AI - 技术设计方案

**文档版本**: v1.0  
**创建日期**: 2025年5月  
**文档状态**: 正式发布

---

## 目录

1. [技术设计总览](#1-技术设计总览)
2. [数据库设计](#2-数据库设计)
3. [API接口设计](#3-api接口设计)
4. [AI引擎设计](#4-ai引擎设计)
5. [前端技术方案](#5-前端技术方案)
6. [消息队列设计](#6-消息队列设计)
7. [缓存设计](#7-缓存设计)
8. [监控告警设计](#8-监控告警设计)

---

## 1. 技术设计总览

### 1.1 设计原则

CareerCompass AI 的技术设计遵循以下核心原则：

1. **标准化**: 遵循行业标准规范（RESTful API、OpenAPI、OAuth2、JWT）
2. **模块化**: 高内聚低耦合，每个服务独立开发、部署、扩展
3. **可测试性**: 代码设计便于单元测试和集成测试
4. **安全性**: 安全设计贯穿始终，默认安全原则
5. **性能优化**: 关键路径优化，避免过早优化，重视性能监控

### 1.2 技术约束

| 约束类型 | 具体要求 | 说明 |
|---------|---------|------|
| 响应时间 | API < 200ms (P99) | 核心业务接口性能要求 |
| 并发用户 | 支持 10万+ 并发 | 峰值处理能力 |
| 可用性 | 99.9% SLA | 年度停机时间 < 8.76小时 |
| 数据安全 | 符合等保2.0 | 国内合规要求 |
| 可扩展性 | 支持水平扩展 | 业务增长时快速扩容 |

### 1.3 标准规范

```yaml
编码规范:
  Java:
    - 遵循 Alibaba Java Coding Guidelines
    - 使用 SonarQube 进行代码质量检查
    - 单元测试覆盖率 > 80%
  
  TypeScript:
    - 使用 ESLint + Prettier
    - 严格模式启用 strict: true
    - 组件测试覆盖率 > 70%

API规范:
  - RESTful API Design Best Practices
  - OpenAPI 3.0 文档规范
  - JSON:API 响应格式
  - RFC 7807 Problem Details 错误格式

数据库规范:
  - 表名小写，下划线分隔
  - 字段必须有注释
  - 索引命名规范: idx_{table}_{column}
  - 禁止使用 SELECT *
```

---

## 2. 数据库设计

### 2.1 数据库选型

| 数据库 | 版本 | 用途 | 选型理由 |
|--------|------|------|----------|
| PostgreSQL | 16.x | 主数据库 | 功能强大，支持JSON，全文检索 |
| Redis | 7.x | 缓存 | 高性能，丰富数据结构 |
| Elasticsearch | 8.x | 搜索引擎 | 简历匹配，日志分析 |
| MinIO | 最新 | 对象存储 | 兼容S3，私有化部署 |

### 2.2 逻辑模型（ER图）

```
┌─────────────────────────────────────────────────────────────────┐
│                     CareerCompass AI ER图                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐
│   user   │       │ assessment│      │  report  │
├──────────┤       ├──────────┤       ├──────────┤
│ id (PK)  │◀─────▶│ id (PK)  │──────▶│ id (PK)  │
│ username │       │ user_id  │       │ assess_id│
│ email    │       │ type     │       │ content  │
│ phone    │       │ score    │       │ created_at│
│ status   │       │ created_at│      └──────────┘
└──────────┘       └──────────┘
      │
      │
      ▼
┌──────────┐       ┌──────────┐       ┌──────────┐
│  resume  │◀─────▶│  resume_ │◀─────▶│ template │
├──────────┤       │  section │       ├──────────┤
│ id (PK)  │       ├──────────┤       │ id (PK)  │
│ user_id  │       │ id (PK)  │       │ name     │
│ title    │       │ resume_id│       │ category │
│ status   │       │ type     │       │ content  │
│ version  │       │ content  │       └──────────┘
└──────────┘       └──────────┘
      │
      ▼
┌──────────┐
│  payment │
├──────────┤
│ id (PK)  │
│ user_id  │
│ type     │
│ amount   │
│ status   │
└──────────┘
```

### 2.3 物理模型（核心表结构）

#### 2.3.1 用户相关表

```sql
-- 用户主表 (sys_user)
CREATE TABLE sys_user (
    id              BIGSERIAL PRIMARY KEY COMMENT '主键ID',
    username        VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email           VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    phone           VARCHAR(20) COMMENT '手机号',
    password_hash   VARCHAR(255) NOT NULL COMMENT '密码哈希(BCrypt)',
    nickname        VARCHAR(50) COMMENT '昵称',
    avatar          VARCHAR(500) COMMENT '头像URL',
    status          SMALLINT DEFAULT 1 COMMENT '状态:0-禁用,1-正常,2-锁定',
    user_type       SMALLINT DEFAULT 1 COMMENT '用户类型:1-个人,2-企业',
    membership_type SMALLINT DEFAULT 0 COMMENT '会员类型:0-免费,1-基础,2-高级',
    membership_expire TIMESTAMP COMMENT '会员到期时间',
    last_login_at   TIMESTAMP COMMENT '最后登录时间',
    last_login_ip   VARCHAR(50) COMMENT '最后登录IP',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted         SMALLINT DEFAULT 0 COMMENT '删除标志:0-正常,1-删除'
) COMMENT '用户主表';

CREATE INDEX idx_sys_user_status ON sys_user(status);
CREATE INDEX idx_sys_user_membership ON sys_user(membership_type);
CREATE INDEX idx_sys_user_created ON sys_user(created_at);

-- 用户资料表 (user_profile)
CREATE TABLE user_profile (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    real_name       VARCHAR(50) COMMENT '真实姓名',
    gender          SMALLINT COMMENT '性别:0-未知,1-男,2-女',
    birthday        DATE COMMENT '出生日期',
    id_card         VARCHAR(18) COMMENT '身份证号(加密存储)',
    location        VARCHAR(100) COMMENT '所在地区',
    address         VARCHAR(200) COMMENT '详细地址',
    education_level SMALLINT COMMENT '最高学历',
    job_status      SMALLINT COMMENT '求职状态',
    expected_city   VARCHAR(100) COMMENT '期望工作城市',
    expected_salary_min INTEGER COMMENT '期望薪资下限',
    expected_salary_max INTEGER COMMENT '期望薪资上限',
    self_intro      TEXT COMMENT '个人简介',
    extra_info      JSONB COMMENT '扩展信息',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT '用户详细资料表';

-- 用户角色关联表 (user_role)
CREATE TABLE user_role (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL COMMENT '用户ID',
    role_id     BIGINT NOT NULL COMMENT '角色ID',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
) COMMENT '用户角色关联表';

CREATE INDEX idx_user_role_user ON user_role(user_id);
```

#### 2.3.2 测评相关表

```sql
-- 测评记录表 (assessment_record)
CREATE TABLE assessment_record (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    assessment_type VARCHAR(30) NOT NULL COMMENT '测评类型:MBTI,Holland,Competency',
    status          SMALLINT DEFAULT 0 COMMENT '状态:0-进行中,1-已完成,2-已取消',
    started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    completed_at    TIMESTAMP COMMENT '完成时间',
    total_questions INTEGER COMMENT '总题数',
    answered_count  INTEGER DEFAULT 0 COMMENT '已答题数',
    score           JSONB COMMENT '各维度得分',
    result_code     VARCHAR(10) COMMENT '结果代码',
    result_data     JSONB COMMENT '结果详情',
    report_url      VARCHAR(500) COMMENT '报告URL',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT '测评记录表';

CREATE INDEX idx_assessment_user ON assessment_record(user_id);
CREATE INDEX idx_assessment_type ON assessment_record(assessment_type);
CREATE INDEX idx_assessment_status ON assessment_record(status);

-- 测评题库表 (assessment_question)
CREATE TABLE assessment_question (
    id              BIGSERIAL PRIMARY KEY,
    assessment_type VARCHAR(30) NOT NULL COMMENT '测评类型',
    category        VARCHAR(50) COMMENT '题目分类',
    question_text   TEXT NOT NULL COMMENT '题目内容',
    options         JSONB NOT NULL COMMENT '选项 [{\"label\":\"A\",\"text\":\"...\",\"score\":{}}]',
    order_num       INTEGER COMMENT '题目顺序',
    is_active       SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT '测评题库表';

CREATE INDEX idx_question_type ON assessment_question(assessment_type);
```

#### 2.3.3 简历相关表

```sql
-- 简历主表 (resume)
CREATE TABLE resume (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    template_id     BIGINT COMMENT '使用模板ID',
    title           VARCHAR(100) NOT NULL COMMENT '简历标题',
    language        VARCHAR(10) DEFAULT 'zh' COMMENT '语言',
    is_default      SMALLINT DEFAULT 0 COMMENT '是否默认简历',
    status          SMALLINT DEFAULT 0 COMMENT '状态:0-草稿,1-已发布',
    visibility      SMALLINT DEFAULT 0 COMMENT '可见性:0-私密,1-公开,2-企业可见',
    completeness_score INTEGER COMMENT '完整度评分',
    ai_optimized    SMALLINT DEFAULT 0 COMMENT '是否AI优化过',
    view_count      INTEGER DEFAULT 0 COMMENT '浏览次数',
    download_count  INTEGER DEFAULT 0 COMMENT '下载次数',
    version         INTEGER DEFAULT 1 COMMENT '版本号',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT '简历主表';

CREATE INDEX idx_resume_user ON resume(user_id);
CREATE INDEX idx_resume_status ON resume(status);
CREATE INDEX idx_resume_template ON resume(template_id);

-- 简历模块表 (resume_section)
CREATE TABLE resume_section (
    id              BIGSERIAL PRIMARY KEY,
    resume_id       BIGINT NOT NULL COMMENT '简历ID',
    section_type    VARCHAR(30) NOT NULL COMMENT '模块类型',
    section_order   INTEGER COMMENT '排序',
    is_visible      SMALLINT DEFAULT 1 COMMENT '是否显示',
    content         JSONB NOT NULL COMMENT '模块内容',
    ai_suggestions  JSONB COMMENT 'AI优化建议',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resume(id) ON DELETE CASCADE
) COMMENT '简历模块表';

-- section_type 枚举:
-- basic: 基本信息
-- education: 教育经历
-- work: 工作经历
-- project: 项目经验
-- skill: 技能特长
-- certificate: 证书荣誉
-- self_eval: 自我评价

CREATE INDEX idx_section_resume ON resume_section(resume_id);
CREATE INDEX idx_section_type ON resume_section(section_type);

-- 简历模板表 (resume_template)
CREATE TABLE resume_template (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL COMMENT '模板名称',
    category        VARCHAR(30) COMMENT '分类:general,tech,finance,creative',
    style           VARCHAR(30) COMMENT '风格:modern,classic,creative,minimal',
    thumbnail       VARCHAR(500) COMMENT '缩略图URL',
    preview_url     VARCHAR(500) COMMENT '预览URL',
    css_content     TEXT COMMENT 'CSS样式',
    html_structure  TEXT COMMENT 'HTML结构',
    is_premium      SMALLINT DEFAULT 0 COMMENT '是否付费模板',
    is_active       SMALLINT DEFAULT 1 COMMENT '是否启用',
    usage_count     INTEGER DEFAULT 0 COMMENT '使用次数',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT '简历模板表';
```

#### 2.3.4 订单支付相关表

```sql
-- 订单表 (orders)
CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    order_no        VARCHAR(32) NOT NULL UNIQUE COMMENT '订单编号',
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    order_type      SMALLINT NOT NULL COMMENT '订单类型:1-会员,2-服务,3-充值',
    product_id      BIGINT COMMENT '商品ID',
    product_name    VARCHAR(100) COMMENT '商品名称',
    quantity        INTEGER DEFAULT 1 COMMENT '数量',
    unit_price      DECIMAL(10,2) COMMENT '单价',
    total_amount    DECIMAL(10,2) NOT NULL COMMENT '订单总额',
    discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT '优惠金额',
    payable_amount  DECIMAL(10,2) NOT NULL COMMENT '应付金额',
    status          SMALLINT DEFAULT 0 COMMENT '状态:0-待支付,1-已支付,2-已取消',
    pay_channel     VARCHAR(20) COMMENT '支付渠道:wechat,alipay',
    pay_time        TIMESTAMP COMMENT '支付时间',
    pay_trade_no    VARCHAR(64) COMMENT '第三方交易号',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT '订单表';

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_no ON orders(order_no);

-- 会员记录表 (user_membership)
CREATE TABLE user_membership (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL COMMENT '用户ID',
    membership_type SMALLINT NOT NULL COMMENT '会员类型',
    start_date      DATE NOT NULL COMMENT '开始日期',
    end_date        DATE NOT NULL COMMENT '结束日期',
    source          VARCHAR(20) COMMENT '来源:buy,gift,promotion',
    order_id        BIGINT COMMENT '关联订单ID',
    is_active       SMALLINT DEFAULT 1 COMMENT '是否有效',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) COMMENT '会员记录表';
```

### 2.4 索引策略

```sql
-- 复合索引示例
-- 测评记录查询优化
CREATE INDEX idx_assessment_user_type ON assessment_record(user_id, assessment_type, completed_at);

-- 简历列表查询优化
CREATE INDEX idx_resume_user_status ON resume(user_id, status, updated_at DESC);

-- 全文搜索索引（PostgreSQL）
CREATE INDEX idx_resume_search ON resume USING GIN(to_tsvector('chinese', title));

-- JSONB索引
CREATE INDEX idx_assessment_score ON assessment_record USING GIN(score);
```

---

## 3. API接口设计

### 3.1 RESTful API规范

```yaml
URL规范:
  基础路径: /api/v1
  资源路径: 使用复数名词，小写，下划线分隔
    - ✅ /api/v1/users
    - ✅ /api/v1/resume_templates
    - ❌ /api/v1/getUsers
    - ❌ /api/v1/user

HTTP方法:
  GET    - 获取资源
  POST   - 创建资源
  PUT    - 全量更新资源
  PATCH  - 部分更新资源
  DELETE - 删除资源

状态码:
  200 OK              - 请求成功
  201 Created         - 创建成功
  204 No Content      - 删除成功
  400 Bad Request     - 请求参数错误
  401 Unauthorized    - 未认证
  403 Forbidden       - 无权限
  404 Not Found       - 资源不存在
  409 Conflict        - 资源冲突
  422 Unprocessable   - 语义错误
  429 Too Many Requests - 请求过于频繁
  500 Server Error    - 服务器内部错误
```

### 3.2 接口清单（按模块分组）

#### 3.2.1 用户模块 API

```yaml
认证相关:
  - POST   /api/v1/auth/register              # 用户注册
  - POST   /api/v1/auth/login                 # 用户登录
  - POST   /api/v1/auth/logout                # 用户登出
  - POST   /api/v1/auth/refresh               # 刷新Token
  - POST   /api/v1/auth/forgot-password       # 忘记密码
  - POST   /api/v1/auth/reset-password        # 重置密码
  - GET    /api/v1/auth/captcha               # 获取验证码

用户管理:
  - GET    /api/v1/users/me                   # 获取当前用户信息
  - PUT    /api/v1/users/me                   # 更新当前用户信息
  - PUT    /api/v1/users/me/password          # 修改密码
  - PUT    /api/v1/users/me/avatar            # 上传头像
  - GET    /api/v1/users/me/profile           # 获取用户详细资料
  - PUT    /api/v1/users/me/profile           # 更新用户详细资料
  - GET    /api/v1/users/me/membership        # 获取会员信息

第三方登录:
  - POST   /api/v1/auth/oauth/wechat          # 微信登录
  - POST   /api/v1/auth/oauth/qq              # QQ登录
  - POST   /api/v1/auth/oauth/weibo           # 微博登录
```

#### 3.2.2 测评模块 API

```yaml
测评管理:
  - GET    /api/v1/assessments                # 获取测评类型列表
  - POST   /api/v1/assessments/{type}/start   # 开始测评
  - POST   /api/v1/assessments/{id}/answer    # 提交答案
  - POST   /api/v1/assessments/{id}/complete  # 完成测评
  - GET    /api/v1/assessments/{id}           # 获取测评记录
  - GET    /api/v1/assessments/{id}/report    # 获取测评报告
  - GET    /api/v1/assessments/{id}/suggestions # 获取职业建议
  
历史记录:
  - GET    /api/v1/users/me/assessments       # 获取我的测评历史
  - DELETE /api/v1/assessments/{id}           # 删除测评记录
```

#### 3.2.3 简历模块 API

```yaml
简历管理:
  - GET    /api/v1/resumes                    # 获取我的简历列表
  - POST   /api/v1/resumes                    # 创建简历
  - GET    /api/v1/resumes/{id}               # 获取简历详情
  - PUT    /api/v1/resumes/{id}               # 更新简历
  - DELETE /api/v1/resumes/{id}               # 删除简历
  - POST   /api/v1/resumes/{id}/duplicate     # 复制简历
  - PUT    /api/v1/resumes/{id}/default       # 设为默认简历

简历模块:
  - GET    /api/v1/resumes/{id}/sections      # 获取简历所有模块
  - POST   /api/v1/resumes/{id}/sections      # 添加模块
  - PUT    /api/v1/resumes/{id}/sections/{sid}# 更新模块
  - DELETE /api/v1/resumes/{id}/sections/{sid}# 删除模块
  - PUT    /api/v1/resumes/{id}/sections/order# 调整模块顺序

AI功能:
  - POST   /api/v1/resumes/{id}/ai-generate   # AI生成内容
  - POST   /api/v1/resumes/{id}/ai-optimize   # AI优化简历
  - GET    /api/v1/resumes/{id}/ai-suggestions# 获取AI建议
  - GET    /api/v1/resumes/{id}/score         # 简历评分

模板与导出:
  - GET    /api/v1/resume-templates           # 获取模板列表
  - GET    /api/v1/resume-templates/{id}      # 获取模板详情
  - PUT    /api/v1/resumes/{id}/template      # 应用模板
  - POST   /api/v1/resumes/{id}/export/pdf    # 导出PDF
  - POST   /api/v1/resumes/{id}/export/word   # 导出Word
  - GET    /api/v1/resumes/{id}/preview       # 预览简历
```

#### 3.2.4 AI助手模块 API

```yaml
智能问答:
  - POST   /api/v1/ai/chat                    # 发起对话
  - GET    /api/v1/ai/chat/{sessionId}        # 获取对话历史
  - DELETE /api/v1/ai/chat/{sessionId}        # 清除对话
  
推荐系统:
  - GET    /api/v1/ai/suggestions/jobs        # 职位推荐
  - GET    /api/v1/ai/suggestions/courses     # 课程推荐
  - GET    /api/v1/ai/suggestions/articles    # 文章推荐

模拟面试:
  - POST   /api/v1/ai/interview/start         # 开始模拟面试
  - POST   /api/v1/ai/interview/answer        # 提交回答
  - GET    /api/v1/ai/interview/{id}/feedback # 获取反馈
```

### 3.3 请求/响应示例

#### 3.3.1 用户注册

```yaml
Request:
  POST /api/v1/auth/register
  Content-Type: application/json
  
  Body:
    {
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "password": "EncryptedPassword123",
      "captcha": "a3f9k2",
      "captcha_key": "captcha_key_uuid"
    }

Response (201 Created):
  {
    "code": 201,
    "message": "注册成功",
    "data": {
      "user": {
        "id": "123456789",
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "nickname": "张三",
        "avatar": null,
        "membership_type": 0,
        "created_at": "2025-05-10T10:30:00Z"
      },
      "tokens": {
        "access_token": "eyJhbGciOiJSUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
        "expires_in": 7200,
        "token_type": "Bearer"
      }
    },
    "timestamp": "2025-05-10T10:30:01Z"
  }
```

#### 3.3.2 创建简历

```yaml
Request:
  POST /api/v1/resumes
  Authorization: Bearer {access_token}
  Content-Type: application/json
  
  Body:
    {
      "title": "Java开发工程师求职简历",
      "template_id": 123,
      "language": "zh"
    }

Response (201 Created):
  {
    "code": 201,
    "message": "创建成功",
    "data": {
      "id": 789,
      "title": "Java开发工程师求职简历",
      "template_id": 123,
      "language": "zh",
      "status": 0,
      "completeness_score": 0,
      "sections": [
        {
          "id": 1,
          "section_type": "basic",
          "content": {
            "name": "",
            "phone": "",
            "email": ""
          }
        }
      ],
      "created_at": "2025-05-10T10:30:00Z",
      "updated_at": "2025-05-10T10:30:00Z"
    },
    "timestamp": "2025-05-10T10:30:01Z"
  }
```

#### 3.3.3 AI生成简历内容

```yaml
Request:
  POST /api/v1/resumes/789/ai-generate
  Authorization: Bearer {access_token}
  Content-Type: application/json
  
  Body:
    {
      "section_type": "work",
      "prompt": "我在腾讯做了3年后端开发，主要负责微信支付的订单系统",
      "tone": "professional",
      "length": "medium"
    }

Response (200 OK):
  {
    "code": 200,
    "message": "success",
    "data": {
      "generated_content": {
        "company": "腾讯科技（深圳）有限公司",
        "position": "高级后端开发工程师",
        "duration": "2021.06 - 2024.06",
        "description": [
          "负责微信支付订单系统的架构设计与核心开发，支撑日均10亿+订单处理",
          "优化数据库查询性能，订单查询响应时间从500ms降低至50ms",
          "设计并实现分布式锁机制，解决高并发场景下的库存超卖问题",
          "主导订单系统的微服务拆分，提升系统可维护性和扩展性"
        ],
        "highlights": [
          "高并发",
          "微服务",
          "性能优化",
          "分布式系统"
        ]
      },
      "suggestions": [
        "建议补充具体的性能指标数据",
        "可以增加团队协作方面的描述"
      ],
      "usage": {
        "model": "gpt-4",
        "tokens_used": 1250,
        "cost": 0.025
      }
    },
    "timestamp": "2025-05-10T10:35:00Z"
  }
```

### 3.4 错误码设计

```yaml
错误码规范:
  格式: A-BBB-CCC
    A   - 错误级别: 1-系统, 2-业务, 3-参数, 4-权限, 5-第三方
    BBB - 模块代码
    CCC - 具体错误序号

系统级错误 (1-000-xxx):
  1000001: 系统繁忙，请稍后再试
  1000002: 服务暂时不可用
  1000003: 数据库连接失败
  1000004: 缓存服务异常

认证授权错误 (1-001-xxx):
  1001001: Token无效或已过期
  1001002: Token已吊销
  1001003: 用户不存在或已被禁用
  1001004: 密码错误
  1001005: 账号已被锁定
  1001006: 没有操作权限

用户模块错误 (2-010-xxx):
  2010001: 用户名已存在
  2010002: 邮箱已注册
  2010003: 手机号已注册
  2010004: 验证码错误
  2010005: 原密码错误

简历模块错误 (2-020-xxx):
  2020001: 简历不存在
  2020002: 简历数量已达上限
  2020003: 模板不存在
  2020004: 无效的简历内容
  2020005: AI生成失败

测评模块错误 (2-030-xxx):
  2030001: 测评类型不存在
  2030002: 测评记录不存在
  2030003: 测评尚未完成
  2030004: 今日测评次数已达上限

订单支付错误 (2-040-xxx):
  2040001: 订单不存在
  2040002: 订单已支付
  2040003: 支付失败
  2040004: 余额不足

参数错误 (3-000-xxx):
  3000001: 请求参数错误
  3000002: 缺少必要参数
  3000003: 参数格式错误
  3000004: 请求体过大
  3000005: JSON解析失败
  
限流熔断错误 (5-000-xxx):
  5000001: 请求过于频繁，请稍后再试
  5000002: 服务暂时不可用，请稍后重试
  5000003: AI服务调用次数已达上限
```

---

## 4. AI引擎设计

### 4.1 LLM集成架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI引擎服务架构                               │
│                       (Python + FastAPI)                        │
└─────────────────────────────────────────────────────────────────┘

                            业务请求
                               │
                               ▼
                    ┌─────────────────────┐
                    │     API Gateway      │
                    │   (Java/Node.js)    │
                    └──────────┬──────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Service (Python)                        │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    请求处理层                                ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
│  │  │ 输入验证 │ │ 参数解析 │ │ 频率限制 │ │ 计费统计 │       ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                  │
                              ▼                                  │
  ┌────────────────────────────────────────────────────────────┐│
  │                    模型路由层 (Model Router)                  ││
  │                                                              ││
  │  根据任务类型、成本、响应速度选择最优模型                          ││
  │                                                              ││
  │  ┌──────────────────────────────────────────────────────┐   ││
  │  │ 路由策略:                                              │   ││
  │  │ • 简单问答 → GPT-3.5 / 文心一言 3.5                    │   ││
  │  │ • 简历生成 → GPT-4 / 文心一言 4.0                      │   ││
  │  │ • 复杂推理 → GPT-4 / Claude 3                          │   ││
  │  │ • 中文场景 → 文心一言 / 通义千问                       │   ││
  │  │ • 英文场景 → GPT-4 / Claude 3                          │   ││
  │  └──────────────────────────────────────────────────────┘   ││
  └────────────────────────────────────────────────────────────┘│
                              │                                  │
           ┌──────────────────┼──────────────────┐              │
           │                  │                  │              │
           ▼                  ▼                  ▼              │
  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
  │   RAG检索增强   │ │   提示词工程    │ │   模型调用      │   │
  │                 │ │                 │ │                 │   │
  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │   │
  │ │ 向量数据库   │ │ │ │ 模板管理    │ │ │ │ OpenAI API  │ │   │
  │ │(Elasticsearch)│ │ │ │ 动态组装    │ │ │ │ 文心一言    │ │   │
  │ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │   │
  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │   │
  │ │ 知识图谱    │ │ │ │ Few-shot    │ │ │ │ 讯飞星火    │ │   │
  │ │(Neo4j)     │ │ │ │ Chain-of-   │ │ │ │ Claude API  │ │   │
  │ └─────────────┘ │ │ │ Thought     │ │ │ └─────────────┘ │   │
  │ ┌─────────────┐ │ │ └─────────────┘ │ │                 │   │
  │ │ 文档检索    │ │ │ ┌─────────────┐ │ │                 │   │
  │ │(BM25 +    │ │ │ │ 输出格式    │ │ │                 │   │
  │ │ Vector)   │ │ │ │ 定义        │ │ │                 │   │
  │ └─────────────┘ │ │ └─────────────┘ │ │                 │   │
  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
                              │                                  │
                              ▼                                  │
  ┌────────────────────────────────────────────────────────────┐│
  │                    后处理层                                  ││
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
  │  │ 内容过滤 │ │ 格式校验 │ │ 结果缓存 │ │ 日志记录 │       ││
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       ││
  └────────────────────────────────────────────────────────────┘│
                              │                                  │
                              ▼                                  │
                    ┌─────────────────────┐                      │
                    │      响应输出        │                      │
                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 提示词工程框架

#### 4.2.1 简历生成提示词

```python
RESUME_GENERATE_PROMPT = """
你是一位资深的职业顾问和简历优化专家。请根据用户提供的信息，生成一段专业、有说服力的简历内容。

## 任务类型
{task_type}

## 用户信息
- 目标岗位: {target_position}
- 行业: {industry}
- 工作年限: {work_years}年
- 原始描述: {user_input}

## 输出要求
1. 使用STAR法则（情境-任务-行动-结果）组织内容
2. 突出可量化的成果和关键指标
3. 使用行业专业术语
4. 语气: {tone}
5. 长度: {length}

## 输出格式
请严格按照以下JSON格式输出:
```json
{
  "company": "公司名称",
  "position": "职位名称",
  "duration": "起止时间",
  "description": ["要点1", "要点2", "要点3", "要点4"],
  "highlights": ["关键词1", "关键词2", "关键词3"],
  "improvement_suggestions": ["改进建议1", "改进建议2"]
}
```

## 示例参考
{examples}

现在请根据用户提供的信息生成简历内容：
"""

# Few-shot示例
EXAMPLES = [
    {
        "input": "我在阿里巴巴做Java开发，负责双十一的订单系统",
        "output": {
            "company": "阿里巴巴集团",
            "position": "Java高级开发工程师",
            "duration": "2020.03 - 2023.06",
            "description": [
                "负责双十一大促订单系统的核心开发与架构优化，支撑峰值每秒100万+订单处理",
                "设计并实现分布式事务解决方案，将订单数据一致性错误率从0.1%降低至0.001%",
                "优化订单查询性能，通过Redis缓存策略和数据库索引优化，查询响应时间从800ms降至80ms",
                "主导订单服务的微服务拆分，将单体应用拆分为10+独立服务，提升系统可维护性"
            ],
            "highlights": ["高并发", "分布式系统", "性能优化", "微服务"],
            "improvement_suggestions": ["建议补充具体的性能指标数字", "可以增加团队协作相关描述"]
        }
    }
]
```

#### 4.2.2 职业建议提示词

```python
CAREER_ADVICE_PROMPT = """
你是一位专业的职业规划顾问，精通MBTI、霍兰德职业兴趣理论以及中国职场发展趋势。

## 用户测评结果
- MBTI类型: {mbti_type}
- 霍兰德代码: {holland_code}
- 能力评估: {competency_scores}
- 教育背景: {education}
- 工作经验: {work_experience}

## 请提供以下内容

### 1. 职业性格分析
基于MBTI类型，分析用户的性格特点、工作风格和优势劣势。

### 2. 适合的职业方向
推荐3-5个高度匹配的职业方向，包括:
- 岗位名称
- 匹配度评分(0-100)
- 推荐理由
- 行业前景

### 3. 发展路径建议
针对推荐的主要职业方向，提供:
- 初级岗位目标
- 3-5年发展路径
- 关键能力要求
- 建议获取的证书/技能

### 4. 求职策略
- 简历关键词优化建议
- 面试技巧
- 目标公司类型

## 输出格式
请以结构化的方式输出，便于前端解析展示。
"""
```

### 4.3 RAG检索增强

#### 4.3.1 知识库架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG知识库架构                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    知识源 (Knowledge Sources)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  职业知识库   │  │  行业数据库   │  │  简历样本库   │          │
│  │              │  │              │  │              │          │
│  │ • MBTI详解   │  │ • 各行业介绍  │  │ • 优秀简历范例│          │
│  │ • 霍兰德职业 │  │ • 职位JD     │  │ • HR点评     │          │
│  │ • 职业百科   │  │ • 薪资数据   │  │ • 改进建议   │          │
│  │ • 发展路径   │  │ • 技能要求   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  求职技巧库   │  │  面试题库    │  │  政策法规库   │          │
│  │              │  │              │  │              │          │
│  │ • 简历技巧   │  │ • 经典面试题  │  │ • 劳动法     │          │
│  │ • 求职策略   │  │ • 行为面试   │  │ • 就业政策   │          │
│  │ • 职场礼仪   │  │ • 技术面试   │  │ • 应届生政策  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 数据导入与处理
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    文档处理管道 (Document Pipeline)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 文档加载  │───▶│ 文本分割  │───▶│ 向量化   │───▶│ 索引存储  │  │
│  │          │    │          │    │          │    │          │  │
│  │ • PDF   │    │ • Chunk  │    │ • BGE   │    │ • ES    │  │
│  │ • Word  │    │   Split  │    │ • OpenAI│    │ • Milvus│  │
│  │ • Markdown│   │ • Semantic│   │ • 国产模型│   │ • PGVector│ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 查询时检索
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    检索与生成 (Retrieve & Generate)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户查询 ──▶ 查询理解 ──▶ 向量检索 ──▶ 重排序 ──▶ 上下文组装    │
│     │           │            │           │            │        │
│     │           ▼            ▼           ▼            ▼        │
│     │      ┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│     │      │意图识别 │  │语义搜索 │ │BM25    │ │Top-K   │   │
│     │      │实体提取 │  │向量召回 │ │关键词  │ │筛选    │   │
│     │      │关键词提取│  │相似度排序│ │  搜索  │ │相关性排序│   │
│     │      └─────────┘  └─────────┘ └─────────┘ └─────────┘   │
│     │                                           │             │
│     │                                           ▼             │
│     │                                     ┌─────────┐         │
│     └────────────────────────────────────▶│ LLM生成 │         │
│                                           └─────────┘         │
│                                               │               │
│                                               ▼               │
│                                           最终答案             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 向量索引配置

```python
# Elasticsearch 向量索引配置
INDEX_CONFIG = {
    "mappings": {
        "properties": {
            "content": {
                "type": "text",
                "analyzer": "ik_max_word",
                "search_analyzer": "ik_smart"
            },
            "content_vector": {
                "type": "dense_vector",
                "dims": 1024,  # BAAI/bge-large-zh 维度
                "index": True,
                "similarity": "cosine"
            },
            "metadata": {
                "properties": {
                    "source": {"type": "keyword"},
                    "category": {"type": "keyword"},
                    "title": {"type": "text"},
                    "tags": {"type": "keyword"},
                    "created_at": {"type": "date"}
                }
            }
        }
    },
    "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1
    }
}

# 检索策略
RETRIEVAL_STRATEGY = {
    "vector_search": {
        "k": 100,  # 向量召回数量
        "min_score": 0.7  # 最低相似度阈值
    },
    "bm25_search": {
        "k": 50,
        "fields": ["title^3", "content^1", "tags^2"]
    },
    "hybrid_search": {
        "rrf_ranking": True,  # 使用RRF融合排序
        "final_k": 10  # 最终返回数量
    }
}
```

---

## 5. 前端技术方案

### 5.1 前端架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端技术架构                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      展示层 (Presentation)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Web 端 (Vue 3)                          │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│  │  │   用户端    │ │   企业端    │ │  管理后台   │         │  │
│  │  │  (PC/Mobile)│ │ (B2B Portal)│ │  (React)   │         │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │  │
│  │                                                           │  │
│  │  技术栈: Vue 3 + TypeScript + Vite + Element Plus + Pinia  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  移动端 (React Native)                     │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐                         │  │
│  │  │   iOS App   │ │  Android App │                         │  │
│  │  └─────────────┘ └─────────────┘                         │  │
│  │                                                           │  │
│  │  技术栈: React Native 0.73 + TypeScript + Expo           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  小程序 (Taro/UniApp)                      │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│  │  │  微信小程序  │ │  支付宝小程序│ │  钉钉小程序  │         │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │  │
│  │                                                           │  │
│  │  技术栈: Taro 3.x + Vue 3 + TypeScript                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Business Logic)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   状态管理 (State Management)              │  │
│  │                                                           │  │
│  │  Vue: Pinia                          React: Redux Toolkit │  │
│  │  ├─ User Store                          ├─ Auth Slice    │  │
│  │  ├─ Resume Store                        ├─ Resume Slice  │  │
│  │  ├─ Assessment Store                    ├─ UI Slice      │  │
│  │  └─ App Store                           └─ Entity Slice  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   API 客户端 (API Client)                  │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│  │  │ Request拦截 │ │ 响应处理   │ │ 错误处理   │         │  │
│  │  │ Token注入   │ │ 数据转换   │ │ 重试机制   │         │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │  │
│  │                                                           │  │
│  │  技术: Axios + 自定义拦截器 + OpenAPI生成器               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   工具库 (Utilities)                       │  │
│  │                                                           │  │
│  │  ├─ Auth: 认证相关工具                                    │  │
│  │  ├─ Storage: 本地存储封装                                 │  │
│  │  ├─ Validator: 表单验证                                   │  │
│  │  ├─ DateTime: 日期时间处理                                │  │
│  │  ├─ Formatter: 数据格式化                                 │  │
│  │  └─ Analytics: 埋点统计                                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      基础设施层 (Infrastructure)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   UI组件库 (Component Library)             │  │
│  │                                                           │  │
│  │  Vue: Element Plus / Ant Design Vue                      │  │
│  │  React: Ant Design / Material UI                         │  │
│  │  通用: 自定义组件库 (CareerUI)                            │  │
│  │  ├─ ResumeEditor (简历编辑器)                            │  │
│  │  ├─ AssessmentUI (测评组件)                              │  │
│  │  ├─ ChatUI (AI对话)                                      │  │
│  │  └─ Charts (图表组件)                                    │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   构建工具 (Build Tools)                   │  │
│  │                                                           │  │
│  │  ├─ Vite: 开发服务器 + 构建                               │  │
│  │  ├─ TypeScript: 类型检查                                  │  │
│  │  ├─ ESLint: 代码规范                                      │  │
│  │  ├─ Prettier: 代码格式化                                  │  │
│  │  ├─ Husky: Git Hooks                                      │  │
│  │  └─ Docker: 容器化部署                                    │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 核心组件设计

#### 5.2.1 简历编辑器组件

```vue
<!-- ResumeEditor.vue 核心简历编辑器组件 -->
<template>
  <div class="resume-editor">
    <!-- 左侧：模块列表 -->
    <aside class="editor-sidebar">
      <SectionList
        :sections="sections"
        :active-id="activeSectionId"
        @select="handleSelect"
        @reorder="handleReorder"
      />
    </aside>
    
    <!-- 中间：编辑区域 -->
    <main class="editor-content">
      <SectionEditor
        v-if="activeSection"
        :type="activeSection.type"
        :content="activeSection.content"
        :ai-suggestions="activeSection.aiSuggestions"
        @update="handleUpdate"
        @ai-generate="handleAIGenerate"
        @ai-optimize="handleAIOptimize"
      />
    </main>
    
    <!-- 右侧：预览区域 -->
    <aside class="editor-preview">
      <ResumePreview
        :resume="resumeData"
        :template="currentTemplate"
        :zoom="previewZoom"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResumeStore } from '@/stores/resume'
import SectionList from './SectionList.vue'
import SectionEditor from './SectionEditor.vue'
import ResumePreview from './ResumePreview.vue'

const resumeStore = useResumeStore()
const activeSectionId = ref<string | null>(null)
const previewZoom = ref(100)

const sections = computed(() => resumeStore.sections)
const activeSection = computed(() => 
  sections.value.find(s => s.id === activeSectionId.value)
)
const resumeData = computed(() => resumeStore.resumeData)
const currentTemplate = computed(() => resumeStore.currentTemplate)

const handleAIGenerate = async (prompt: string) => {
  const result = await resumeStore.generateWithAI({
    sectionId: activeSectionId.value,
    prompt,
    tone: 'professional',
    length: 'medium'
  })
  return result
}

const handleAIOptimize = async () => {
  const result = await resumeStore.optimizeWithAI({
    sectionId: activeSectionId.value,
    content: activeSection.value?.content
  })
  return result
}
</script>
```

#### 5.2.2 AI对话组件

```vue
<!-- AIChat.vue AI助手对话组件 -->
<template>
  <div class="ai-chat">
    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesRef">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :role="msg.role"
        :content="msg.content"
        :suggestions="msg.suggestions"
        :is-typing="msg.isTyping"
        @suggestion-click="handleSuggestion"
      />
    </div>
    
    <!-- 快捷问题 -->
    <div class="quick-questions">
      <QuickQuestion
        v-for="q in quickQuestions"
        :key="q.id"
        :text="q.text"
        :icon="q.icon"
        @click="sendQuestion(q.text)"
      />
    </div>
    
    <!-- 输入区域 -->
    <div class="chat-input">
      <textarea
        v-model="inputText"
        :placeholder="placeholder"
        @keydown.enter.prevent="sendMessage"
        :disabled="isLoading"
      />
      <button 
        @click="sendMessage" 
        :disabled="!inputText.trim() || isLoading"
      >
        <SendIcon />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useAIStore } from '@/stores/ai'

const aiStore = useAIStore()
const inputText = ref('')
const messagesRef = ref<HTMLElement>()
const isLoading = computed(() => aiStore.isLoading)
const messages = computed(() => aiStore.messages)

const quickQuestions = [
  { id: 1, text: '分析我的MBTI测评结果', icon: '🧠' },
  { id: 2, text: '优化我的简历内容', icon: '📝' },
  { id: 3, text: '推荐适合我的职位', icon: '💼' },
  { id: 4, text: '准备Java面试', icon: '💻' }
]

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  
  const text = inputText.value.trim()
  inputText.value = ''
  
  await aiStore.sendMessage(text)
  
  // 滚动到底部
  nextTick(() => {
    messagesRef.value?.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: 'smooth'
    })
  })
}
</script>
```

---

## 6. 消息队列设计

### 6.1 事件驱动架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     事件驱动架构                                 │
└─────────────────────────────────────────────────────────────────┘

服务A                事件总线(Kafka)              服务B/C/D
  │                         │                        │
  │    ┌────────────────────┼────────────────────┐  │
  │    │                    │                    │  │
  ▼    ▼                    ▼                    ▼  │
产生事件 ───────────▶ 发布到Topic  ───────────▶ 订阅消费
  │                                                 │
  │                                                 │
  │  事件格式:                                      │
  │  {                                              │
  │    "event_id": "uuid",                          │
  │    "event_type": "user.registered",             │
  │    "timestamp": "2025-05-10T10:00:00Z",         │
  │    "payload": {...},                            │
  │    "source": "user-service"                     │
  │  }                                              │
  │                                                 │
```

### 6.2 Topic设计

```yaml
# Kafka Topic 配置

topics:
  # 用户相关事件
  user-events:
    partitions: 12
    replication: 3
    retention: 7d
    events:
      - user.registered      # 用户注册
      - user.login           # 用户登录
      - user.logout          # 用户登出
      - user.profile.updated # 资料更新
      - user.password.changed # 密码修改
      - user.deleted         # 账号注销

  # 测评相关事件
  assessment-events:
    partitions: 8
    replication: 3
    retention: 30d
    events:
      - assessment.started    # 测评开始
      - assessment.completed  # 测评完成
      - assessment.cancelled  # 测评取消
      - report.generated      # 报告生成

  # 简历相关事件
  resume-events:
    partitions: 16
    replication: 3
    retention: 30d
    events:
      - resume.created        # 简历创建
      - resume.updated        # 简历更新
      - resume.deleted        # 简历删除
      - resume.exported       # 简历导出
      - resume.shared         # 简历分享
      - ai.optimization.requested  # AI优化请求
      - ai.optimization.completed  # AI优化完成

  # 订单支付事件
  payment-events:
    partitions: 8
    replication: 3
    retention: 90d
    events:
      - order.created         # 订单创建
      - order.paid            # 订单支付
      - order.cancelled       # 订单取消
      - order.refunded        # 订单退款
      - membership.activated  # 会员激活
      - membership.expired    # 会员到期

  # 通知事件
  notification-events:
    partitions: 8
    replication: 3
    retention: 3d
    events:
      - notification.email.requested  # 邮件通知请求
      - notification.sms.requested    # 短信通知请求
      - notification.push.requested   # 推送通知请求
```

### 6.3 消费者组设计

```yaml
# 消费者组配置

consumer_groups:
  # 通知服务消费者组
  notification-service:
    topics:
      - user-events
      - assessment-events
      - payment-events
    concurrency: 10  # 并发消费者数
    handler:
      - user.registered: sendWelcomeEmail
      - assessment.completed: sendReportNotification
      - order.paid: sendPaymentConfirmation

  # 数据分析消费者组
  analytics-service:
    topics:
      - user-events
      - assessment-events
      - resume-events
      - payment-events
    concurrency: 5
    handler:
      - "*": collectMetrics  # 所有事件都收集统计

  # AI服务消费者组
  ai-service:
    topics:
      - resume-events
    concurrency: 20  # AI任务较重，需要更多并发
    handler:
      - ai.optimization.requested: processAIOptimization

  # 积分服务消费者组
  points-service:
    topics:
      - user-events
      - assessment-events
      - resume-events
    concurrency: 5
    handler:
      - user.registered: grantRegisterPoints
      - assessment.completed: grantAssessmentPoints
      - resume.created: grantCreatePoints
```

---

## 7. 缓存设计

### 7.1 多级缓存架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     多级缓存架构                                 │
└─────────────────────────────────────────────────────────────────┘

    请求
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  L1: 本地缓存 (Caffeine/Guava)                                   │
│  ├─ 容量: 10,000 entries                                        │
│  ├─ 过期: 5 minutes                                             │
│  ├─ 场景: 用户会话、热点配置、字典数据                          │
│  └─ 命中率: ~80%                                                │
└─────────────────────────────────────────────────────────────────┘
      │ 未命中
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  L2: 分布式缓存 (Redis Cluster)                                  │
│  ├─ 容量: 32GB (3主3从)                                         │
│  ├─ 过期: 1-24 hours                                            │
│  ├─ 场景: 用户资料、简历数据、测评结果、热点数据                │
│  ├─ 模式: Cache-Aside                                           │
│  └─ 命中率: ~95%                                                │
└─────────────────────────────────────────────────────────────────┘
      │ 未命中
      ▼
┌─────────────────────────────────────────────────────────────────┐
│  L3: 数据库 (PostgreSQL)                                         │
│  └─ 持久化存储                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 缓存策略

```yaml
# 缓存策略配置

strategies:
  # Cache-Aside (旁路缓存) - 默认策略
  cache-aside:
    read:
      1. 从缓存读取
      2. 命中则返回
      3. 未命中则从DB读取
      4. 写入缓存
      5. 返回数据
    write:
      1. 写入DB
      2. 删除/更新缓存
      
  # Read-Through (读穿透)
  read-through:
    - 缓存未命中时自动从DB加载
    - 由缓存组件管理
    
  # Write-Through (写穿透)
  write-through:
    - 先写缓存，同步写DB
    - 数据一致性高，性能稍低
    
  # Write-Behind (异步写)
  write-behind:
    - 先写缓存，异步批量写DB
    - 高性能，有数据丢失风险

# 应用策略选择
applications:
  user-profile:
    strategy: cache-aside
    ttl: 1h
    
  resume-data:
    strategy: cache-aside
    ttl: 30m
    
  assessment-result:
    strategy: cache-aside
    ttl: 24h  # 测评结果变化少
    
  hot-templates:
    strategy: cache-aside
    ttl: 1h
    
  system-config:
    strategy: cache-aside
    ttl: 10m
    refresh: 1m  # 主动刷新
```

### 7.3 缓存Key规范

```yaml
# Redis Key命名规范
# 格式: {prefix}:{module}:{identifier}:{detail}

key_patterns:
  # 用户相关
  user:session:{token}:
    ttl: 2h
    value: JSON序列化的Session对象
    
  user:profile:{user_id}:
    ttl: 1h
    value: 用户资料JSON
    
  user:membership:{user_id}:
    ttl: 30m
    value: 会员信息
    
  # 简历相关
  resume:data:{resume_id}:
    ttl: 30m
    value: 简历完整数据
    
  resume:sections:{resume_id}:
    ttl: 30m
    value: 简历模块列表
    
  resume:preview:{resume_id}:{version}:
    ttl: 1h
    value: 预览HTML/URL
    
  # 测评相关
  assessment:result:{assessment_id}:
    ttl: 24h
    value: 测评结果
    
  assessment:suggestions:{mbti_type}:{holland_code}:
    ttl: 24h
    value: 职业建议缓存
    
  # 热点数据
  hot:templates:
    ttl: 1h
    value: 热门模板列表
    
  hot:jobs:{category}:
    ttl: 2h
    value: 热门职位推荐
    
  # 限流计数
  ratelimit:{user_id}:{api}:
    ttl: 1m
    value: 请求计数
    
  # 分布式锁
  lock:{resource}:{identifier}:
    ttl: 30s
    value: 锁持有者标识

# 示例
examples:
  - user:session:eyJhbGciOiJSUzI1NiIs...
  - user:profile:123456789
  - resume:data:987654321
  - assessment:result:555666777
  - hot:templates
```

---

## 8. 监控告警设计

### 8.1 可观测性体系

```
┌─────────────────────────────────────────────────────────────────┐
│                     可观测性体系                                 │
│                  (Metrics + Logging + Tracing)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Metrics (指标监控)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Prometheus  ──────▶  采集存储  ──────▶  Grafana 可视化          │
│       │                                           │             │
│       │                                           ▼             │
│       │                                    ┌─────────────┐      │
│       │                                    │  Dashboards │      │
│       │                                    ├─────────────┤      │
│       │                                    │ • 系统概览  │      │
│       │                                    │ • 业务指标  │      │
│       │                                    │ • API性能   │      │
│       │                                    │ • AI服务    │      │
│       │                                    │ • 成本分析  │      │
│       │                                    └─────────────┘      │
│       │                                                         │
│   采集目标:                                                     │
│   ├─ System: CPU / 内存 / 磁盘 / 网络                          │
│   ├─ JVM: 堆内存 / GC / 线程 / 类加载                          │
│   ├─ Application: QPS / 延迟 / 错误率                          │
│   ├─ Business: DAU / 付费率 / 转化率                           │
│   └─ AI: Token消耗 / 响应时间 / 成功率                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Logging (日志收集)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  应用日志  ───▶  Filebeat  ───▶  Logstash  ───▶  Elasticsearch  │
│     │                             │                    │        │
│     │                             ▼                    ▼        │
│     │                       ┌─────────┐          ┌─────────┐    │
│     │                       │ 解析加工 │          │ 存储索引 │    │
│     │                       └─────────┘          └─────────┘    │
│     │                                                  │        │
│     │                                                  ▼        │
│     │                                           ┌─────────┐     │
│     └──────────────────────────────────────────▶│  Kibana │     │
│                                                 │  查询分析│     │
│                                                 └─────────┘     │
│                                                                 │
│  日志规范:                                                      │
│  - 格式: JSON结构化                                             │
│  - 级别: DEBUG/INFO/WARN/ERROR/FATAL                            │
│  - 内容: timestamp/level/service/trace_id/message/fields        │
│  - 保留: 30天                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Tracing (链路追踪)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  请求 ───▶ Gateway ───▶ Service A ───▶ Service B ───▶ DB       │
│   │          │             │              │             │       │
│   │          ▼             ▼              ▼             ▼       │
│   │     ┌─────────────────────────────────────────────────────┐ │
│   └────▶│              SkyWalking / Jaeger                   │ │
│         │                                                   │ │
│         │  Trace: 完整请求链路                               │ │
│         │  Span:  每个调用节点                               │ │
│         │  Tags:  调用细节                                   │ │
│         │                                                   │ │
│         └─────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │  链路分析 UI     │                          │
│                    │  - 延迟分析     │                          │
│                    │  - 依赖拓扑     │                          │
│                    │  - 慢查询定位   │                          │
│                    └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 告警规则

```yaml
# Prometheus Alertmanager 告警规则

groups:
  - name: system-alerts
    rules:
      # CPU告警
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU使用率过高"
          description: "{{ $labels.instance }} CPU使用率超过80%"
          
      # 内存告警
      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "内存使用率过高"
          description: "{{ $labels.instance }} 内存使用率超过85%"

  - name: application-alerts
    rules:
      # 错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API错误率过高"
          description: "{{ $labels.service }} 错误率超过1%"
          
      # 延迟告警
      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_bucket[5m])) > 1
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "API响应延迟过高"
          description: "{{ $labels.service }} P99延迟超过1秒"
          
      # 服务不可用
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "{{ $labels.instance }} 服务已宕机"

  - name: business-alerts
    rules:
      # 订单异常
      - alert: OrderFailureSpike
        expr: increase(orders_failed_total[1h]) > 100
        labels:
          severity: warning
        annotations:
          summary: "订单失败异常"
          description: "1小时内订单失败超过100笔"
          
      # AI服务异常
      - alert: AIServiceError
        expr: rate(ai_requests_failed_total[5m]) > 0.05
        labels:
          severity: critical
        annotations:
          summary: "AI服务异常"
          description: "AI服务失败率超过5%"
```

### 8.3 告警通知渠道

```yaml
# Alertmanager 通知配置

notification_channels:
  # 紧急告警 - 电话/短信
  critical:
    - type: pagerduty
      service_key: xxx
    - type: sms
      to: +86-xxx
    
  # 重要告警 - 钉钉/企业微信
  warning:
    - type: dingtalk
      webhook: https://oapi.dingtalk.com/robot/send?access_token=xxx
      at_all: false
    - type: wechat
      webhook: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
      
  # 一般告警 - 邮件/群通知
  info:
    - type: email
      to: ops@careercompass.ai
    - type: slack
      webhook: https://hooks.slack.com/services/xxx

# 告警分级处理
alert_routing:
  - match:
      severity: critical
    receiver: critical
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 1h
    
  - match:
      severity: warning
    receiver: warning
    group_wait: 1m
    group_interval: 10m
    repeat_interval: 4h
    
  - match:
      severity: info
    receiver: info
    group_wait: 5m
    group_interval: 30m
    repeat_interval: 24h
```

---

**文档结束**

*技术设计方案 v1.0*  
*CareerCompass AI 技术团队*
