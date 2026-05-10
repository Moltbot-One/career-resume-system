# CareerCompass AI - 平台部署手册

**文档版本**: v1.0  
**创建日期**: 2025年5月  
**文档状态**: 正式发布

---

## 目录

1. [部署概述](#1-部署概述)
2. [环境准备](#2-环境准备)
3. [Docker环境搭建](#3-docker环境搭建)
4. [Kubernetes部署](#4-kubernetes部署)
5. [数据库部署](#5-数据库部署)
6. [中间件部署](#6-中间件部署)
7. [应用服务部署](#7-应用服务部署)
8. [监控与日志](#8-监控与日志)
9. [备份与恢复](#9-备份与恢复)
10. [安全加固](#10-安全加固)

---

## 1. 部署概述

### 1.1 部署目标

本文档描述了 CareerCompass AI 平台的完整部署流程，包括：

- 开发环境搭建（Docker Compose）
- 生产环境部署（Kubernetes）
- 数据库集群部署
- 中间件部署
- 应用服务部署
- 监控告警配置
- 备份恢复策略
- 安全加固方案

### 1.2 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     生产环境部署架构                             │
└─────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   流量入口   │
                              │  (CDN/WAF)  │
                              └──────┬──────┘
                                     │
                              ┌─────────────┐
                              │  负载均衡器  │
                              │   (SLB)     │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │   K8s集群    │  │   K8s集群    │  │   K8s集群    │
            │  (华北-北京) │  │  (华东-上海) │  │  (华南-广州) │
            └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes 集群内部                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Ingress Controller                      │  │
│  │                (NGINX / Kong / Traefik)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                      应用服务层                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ 用户服务 │ │ 测评服务 │ │ 简历服务 │ │  AI服务  │   │  │
│  │  │ (3副本)  │ │ (3副本)  │ │ (3副本)  │ │ (5副本)  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ 规划服务 │ │ 订单服务 │ │ 内容服务 │ │ 消息服务 │   │  │
│  │  │ (3副本)  │ │ (3副本)  │ │ (2副本)  │ │ (3副本)  │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      数据层                                  │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │  │
│  │  │  PostgreSQL  │ │    Redis     │ │Elasticsearch │      │  │
│  │  │   (主从)     │ │  (Cluster)   │ │   (集群)     │      │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘      │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │  │
│  │  │    MinIO     │ │    Kafka     │ │  Prometheus  │      │  │
│  │  │  (对象存储)   │ │  (消息队列)   │ │   (监控)     │      │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 环境规划

| 环境 | 用途 | 规模 | 可用性 |
|------|------|------|--------|
| **开发环境** | 日常开发、功能验证 | 最小化，单实例 | 工作日 9:00-21:00 |
| **测试环境** | QA测试、集成测试 | 与生产同配，2副本 | 7x24 |
| **预发布环境** | 生产发布前验证 | 与生产同配，3副本 | 7x24 |
| **生产环境** | 正式对外服务 | 高可用集群，3-5副本 | 7x24，99.9% SLA |

---

## 2. 环境准备

### 2.1 服务器规格

#### 2.1.1 生产环境服务器配置

| 节点类型 | 数量 | CPU | 内存 | 磁盘 | 网络 | 用途 |
|---------|------|-----|------|------|------|------|
| Master节点 | 3 | 8核 | 16GB | 200GB SSD | 10Gbps | K8s控制平面 |
| Worker节点 | 6 | 16核 | 64GB | 500GB SSD | 10Gbps | 应用服务 |
| 数据库节点 | 3 | 16核 | 64GB | 1TB SSD | 10Gbps | PostgreSQL集群 |
| 缓存节点 | 3 | 8核 | 32GB | 200GB SSD | 10Gbps | Redis集群 |
| 存储节点 | 3 | 8核 | 16GB | 4TB HDD | 10Gbps | MinIO对象存储 |
| 监控节点 | 2 | 4核 | 8GB | 200GB SSD | 1Gbps | 监控告警 |

#### 2.1.2 开发/测试环境配置

| 环境 | 节点数 | 单节点配置 | 用途 |
|------|--------|----------|------|
| 开发环境 | 1 | 4核8G | All-in-One |
| 测试环境 | 3 | 8核16G | 最小高可用 |
| 预发布环境 | 5 | 8核32G | 接近生产 |

### 2.2 软件依赖

#### 2.2.1 操作系统

| 组件 | 版本 | 说明 |
|------|------|------|
| CentOS | 7.9 / 8.x | 生产环境首选 |
| Ubuntu | 22.04 LTS | 开发/测试环境 |
| Rocky Linux | 9.x | 替代CentOS |

#### 2.2.2 容器运行时

| 组件 | 版本 | 说明 |
|------|------|------|
| Docker | 24.x | 容器运行时 |
| containerd | 1.7.x | K8s默认运行时 |
| Kubernetes | 1.28.x | 容器编排 |
| Helm | 3.13.x | K8s包管理 |

#### 2.2.3 数据库与中间件

| 组件 | 版本 | 说明 |
|------|------|------|
| PostgreSQL | 16.x | 主数据库 |
| Redis | 7.x | 缓存 |
| Elasticsearch | 8.x | 搜索引擎 |
| Kafka | 3.x | 消息队列 |
| MinIO | 最新 | 对象存储 |

### 2.3 网络规划

#### 2.3.1 网络拓扑

```
┌─────────────────────────────────────────────────────────────────┐
│                     网络拓扑架构                                 │
└─────────────────────────────────────────────────────────────────┘

Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DMZ 区域                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   CDN节点    │  │   WAF       │  │  负载均衡器  │            │
│  │  (静态加速)  │  │  (Web防火墙) │  │   (SLB)     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      核心业务区域 (VPC)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Kubernetes 集群                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │ Ingress  │ │  App Pod │ │  App Pod │ │  App Pod │    │  │
│  │  │ Controller│ │ (微服务) │ │ (微服务) │ │ (微服务) │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  数据库集群   │ │   缓存集群   │ │   搜索集群   │            │
│  │ (PostgreSQL) │ │   (Redis)    │ │(Elasticsearch)│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      管理运维区域                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   监控告警    │ │   日志中心   │ │   跳板机    │            │
│  │(Prometheus+ │ │  (ELK Stack) │ │  (Bastion)  │            │
│  │  Grafana)   │ │              │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3.2 端口规划

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| API Gateway | 80/443 | HTTP/HTTPS | 统一入口 |
| Kubernetes API | 6443 | HTTPS | K8s管理 |
| PostgreSQL | 5432 | TCP | 主数据库 |
| Redis | 6379 | TCP | 缓存服务 |
| Elasticsearch | 9200 | HTTP | 搜索引擎 |
| Kibana | 5601 | HTTP | 日志分析 |
| Prometheus | 9090 | HTTP | 监控服务 |
| Grafana | 3000 | HTTP | 监控面板 |
| MinIO | 9000/9001 | HTTP | 对象存储 |

---

## 3. Docker环境搭建

### 3.1 安装Docker

```bash
# CentOS 7/8 安装Docker

# 1. 卸载旧版本
sudo yum remove docker docker-client docker-client-latest docker-common \
  docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 2. 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 3. 添加Docker源
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 4. 安装Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 5. 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 6. 验证安装
docker --version
docker-compose --version

# 7. 配置Docker（可选）
# 配置镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3.2 安装Docker Compose

```bash
# 安装Docker Compose

# 1. 下载最新版本
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 2. 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 3. 创建软链接
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 4. 验证安装
docker-compose --version
```

### 3.3 Docker Compose配置

```yaml
# docker-compose.yml - 开发环境配置
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    container_name: career-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: career
      POSTGRES_PASSWORD: career123456
      POSTGRES_DB: careercompass
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U career -d careercompass"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - career-network

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: career-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis123456
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - career-network

  # Elasticsearch 搜索引擎
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: career-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - career-network

  # MinIO 对象存储
  minio:
    image: minio/minio:latest
    container_name: career-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123456
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - career-network

  # 后端服务 - 用户服务
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    container_name: career-user-service
    restart: unless-stopped
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/careercompass
      - SPRING_DATASOURCE_USERNAME=career
      - SPRING_DATASOURCE_PASSWORD=career123456
      - SPRING_REDIS_HOST=redis
      - SPRING_REDIS_PASSWORD=redis123456
      - SPRING_ELASTICSEARCH_URIS=http://elasticsearch:9200
    ports:
      - "8081:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - career-network

  # 前端应用
  web-app:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: career-web
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - user-service
    networks:
      - career-network

  # Prometheus 监控
  prometheus:
    image: prom/prometheus:latest
    container_name: career-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - career-network

  # Grafana 可视化
  grafana:
    image: grafana/grafana:latest
    container_name: career-grafana
    restart: unless-stopped
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    networks:
      - career-network

# 数据卷定义
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  elasticsearch_data:
    driver: local
  minio_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

# 网络定义
networks:
  career-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 3.4 Docker Compose启动

```bash
# 1. 克隆项目代码
git clone https://github.com/careercompass/ai-platform.git
cd ai-platform

# 2. 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件，修改密码等敏感信息

# 3. 创建数据目录
mkdir -p data/{postgres,redis,elasticsearch,minio}

# 4. 启动服务（开发模式）
docker-compose up -d

# 5. 查看服务状态
docker-compose ps

# 6. 查看日志
docker-compose logs -f

# 7. 停止服务
docker-compose down

# 8. 完全清理（包括数据卷）
docker-compose down -v
```

### 3.5 常用Docker命令

```bash
# 查看容器列表
docker ps -a

# 进入容器内部
docker exec -it <container_name> /bin/bash
docker exec -it career-postgres psql -U career -d careercompass

# 查看容器日志
docker logs -f <container_name>

# 重启容器
docker restart <container_name>

# 构建镜像
docker build -t career-user-service:latest ./services/user-service

# 推送镜像到仓库
docker tag career-user-service:latest registry.example.com/career/user-service:latest
docker push registry.example.com/career/user-service:latest

# 拉取镜像
docker pull registry.example.com/career/user-service:latest

# 查看镜像列表
docker images

# 清理未使用的镜像
docker image prune -a

# 查看网络列表
docker network ls

# 查看数据卷列表
docker volume ls

# 清理未使用的数据卷
docker volume prune
```

---

## 4. Kubernetes部署

### 4.1 Kubernetes集群搭建

```bash
# 使用 kubeadm 搭建 K8s 集群

# 1. 准备环境（所有节点）
# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 关闭 SELinux
setenforce 0
sed -i 's/^SELINUX=enforcing$/SELINUX=disabled/' /etc/selinux/config

# 关闭 swap
swapoff -a
sed -i '/swap/d' /etc/fstab

# 配置内核参数
cat <<EOF > /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system

# 2. 安装 containerd
# 安装依赖
yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 源
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 containerd
yum install -y containerd.io

# 配置 containerd
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 修改 systemd cgroup driver
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# 配置镜像加速器
sed -i 's|registry.k8s.io|registry.aliyuncs.com/google_containers|g' /etc/containerd/config.toml

# 启动 containerd
systemctl start containerd
systemctl enable containerd

# 3. 安装 kubeadm, kubelet, kubectl
# 添加 K8s 源
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
EOF

# 安装
yum install -y kubeadm-1.28.0 kubelet-1.28.0 kubectl-1.28.0

# 启动 kubelet
systemctl start kubelet
systemctl enable kubelet

# 4. 初始化 Master 节点（仅在 master 执行）
# 拉取镜像
kubeadm config images pull --image-repository=registry.aliyuncs.com/google_containers

# 初始化集群
kubeadm init \
  --apiserver-advertise-address=192.168.1.10 \
  --image-repository=registry.aliyuncs.com/google_containers \
  --kubernetes-version=v1.28.0 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16 \
  --ignore-preflight-errors=all

# 配置 kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 保存 join 命令（用于添加 worker 节点）
kubeadm token create --print-join-command > ~/kubeadm-join.sh

# 5. 安装网络插件 (Calico)
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# 6. 添加 Worker 节点（在 worker 节点执行）
# 使用之前保存的 join 命令
sudo kubeadm join 192.168.1.10:6443 --token xxx --discovery-token-ca-cert-hash sha256:xxx

# 7. 验证集群状态
kubectl get nodes
kubectl get pods -n kube-system
```

### 4.2 基础组件部署

```bash
# 安装 Helm

# 下载 Helm
wget https://get.helm.sh/helm-v3.13.0-linux-amd64.tar.gz
tar -zxvf helm-v3.13.0-linux-amd64.tar.gz
sudo mv linux-amd64/helm /usr/local/bin/helm

# 验证
helm version

# 添加常用 Helm 仓库
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update

# 安装 Ingress Controller (NGINX)
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux

# 安装 Cert-Manager (用于HTTPS证书自动管理)
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0 \
  --set installCRDs=true

# 安装 Metrics Server (用于HPA自动扩缩容)
helm install metrics-server stable/metrics-server \
  --namespace kube-system \
  --set args[0]=--kubelet-insecure-tls
```

### 4.3 应用服务部署

```yaml
# k8s/namespace.yaml - 创建命名空间
apiVersion: v1
kind: Namespace
metadata:
  name: careercompass
  labels:
    name: careercompass
    env: production

---
# k8s/configmap.yaml - 配置映射
apiVersion: v1
kind: ConfigMap
metadata:
  name: career-config
  namespace: careercompass
data:
  application.yml: |
    spring:
      profiles:
        active: k8s
      datasource:
        url: jdbc:postgresql://postgres-service:5432/careercompass
        username: career
        password: ${DB_PASSWORD}
      redis:
        host: redis-service
        port: 6379
        password: ${REDIS_PASSWORD}
      elasticsearch:
        uris: http://elasticsearch-service:9200
    
    server:
      port: 8080
      
    management:
      endpoints:
        web:
          exposure:
            include: health,info,metrics,prometheus
      metrics:
        export:
          prometheus:
            enabled: true

---
# k8s/secret.yaml - 密钥（使用base64编码）
apiVersion: v1
kind: Secret
metadata:
  name: career-secrets
  namespace: careercompass
type: Opaque
data:
  # echo -n 'career123456' | base64
  db-password: Y2FyZWVyMTIzNDU2
  # echo -n 'redis123456' | base64
  redis-password: cmVkaXMxMjM0NTY=
  # echo -n 'jwt-secret-key-2024' | base64
  jwt-secret: and0LXNlY3JldC1rZXktMjAyNA==

---
# k8s/user-service.yaml - 用户服务
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: careercompass
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: careercompass/user-service:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "k8s"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: career-secrets
                  key: db-password
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: career-secrets
                  key: redis-password
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: career-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: config
              mountPath: /app/config
      volumes:
        - name: config
          configMap:
            name: career-config
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: careercompass
  labels:
    app: user-service
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
      name: http
  selector:
    app: user-service
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: careercompass
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### 4.4 部署应用

```bash
# 1. 应用K8s配置
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/user-service.yaml

# 2. 查看部署状态
kubectl get all -n careercompass

# 3. 查看Pod日志
kubectl logs -f deployment/user-service -n careercompass

# 4. 端口转发（本地测试）
kubectl port-forward svc/user-service 8080:8080 -n careercompass

# 5. 扩容
cubectl scale deployment user-service --replicas=5 -n careercompass

# 6. 查看HPA状态
kubectl get hpa -n careercompass
```

---

## 5. 数据库部署

### 5.1 PostgreSQL主从部署

```yaml
# postgres-master.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-master
  namespace: careercompass
spec:
  serviceName: postgres-master
  replicas: 1
  selector:
    matchLabels:
      app: postgres
      role: master
  template:
    metadata:
      labels:
        app: postgres
        role: master
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: postgres
          env:
            - name: POSTGRES_USER
              value: career
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: career-secrets
                  key: db-password
            - name: POSTGRES_DB
              value: careercompass
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: postgres-master-storage
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
  volumeClaimTemplates:
    - metadata:
        name: postgres-master-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
        storageClassName: fast-ssd

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-master
  namespace: careercompass
  labels:
    app: postgres
    role: master
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
      protocol: TCP
      name: postgres
  selector:
    app: postgres
    role: master
```

### 5.2 Redis Cluster部署

```yaml
# redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: careercompass
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis
      component: cluster
  template:
    metadata:
      labels:
        app: redis
        component: cluster
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
              name: client
            - containerPort: 16379
              name: gossip
          command:
            - redis-server
            - /etc/redis/redis.conf
          volumeMounts:
            - name: redis-config
              mountPath: /etc/redis
            - name: redis-data
              mountPath: /data
          resources:
            requests:
              memory: "512Mi"
              cpu: "200m"
            limits:
              memory: "1Gi"
              cpu: "500m"
      volumes:
        - name: redis-config
          configMap:
            name: redis-cluster-config
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
        storageClassName: standard

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-cluster-config
  namespace: careercompass
data:
  redis.conf: |
    port 6379
    cluster-enabled yes
    cluster-config-file nodes.conf
    cluster-node-timeout 5000
    appendonly yes
    appendfsync everysec
    requirepass ${REDIS_PASSWORD}
    masterauth ${REDIS_PASSWORD}
    maxmemory 1gb
    maxmemory-policy allkeys-lru

---
apiVersion: v1
kind: Service
metadata:
  name: redis-cluster
  namespace: careercompass
  labels:
    app: redis
    component: cluster
spec:
  type: ClusterIP
  clusterIP: None
  ports:
    - port: 6379
      targetPort: 6379
      name: client
    - port: 16379
      targetPort: 16379
      name: gossip
  selector:
    app: redis
    component: cluster
```

---

## 6. 监控与日志

### 6.1 Prometheus配置

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: careercompass
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets: ['alertmanager:9093']
    
    rule_files:
      - /etc/prometheus/rules/*.yml
    
    scrape_configs:
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
      
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
          - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
            action: keep
            regex: default;kubernetes;https
      
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
          - target_label: __address__
            replacement: kubernetes.default.svc:443
          - source_labels: [__meta_kubernetes_node_name]
            regex: (.+)
            target_label: __metrics_path__
            replacement: /api/v1/nodes/${1}/proxy/metrics
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            target_label: __address__
            replacement: $1:$2
          - action: labelmap
            regex: __meta_kubernetes_pod_label_(.+)
          - source_labels: [__meta_kubernetes_namespace]
            action: replace
            target_label: kubernetes_namespace
          - source_labels: [__meta_kubernetes_pod_name]
            action: replace
            target_label: kubernetes_pod_name

---
# 告警规则
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-rules
  namespace: careercompass
data:
  careercompass-rules.yml: |
    groups:
      - name: careercompass-alerts
        rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "{{ $labels.service }} has a high error rate of {{ $value }}"
          
          - alert: HighLatency
            expr: histogram_quantile(0.99, rate(http_request_duration_bucket[5m])) > 1
            for: 3m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected"
              description: "{{ $labels.service }} has a P99 latency of {{ $value }}s"
          
          - alert: ServiceDown
            expr: up == 0
            for: 1m
            labels:
              severity: critical
            annotations:
              summary: "Service is down"
              description: "{{ $labels.instance }} is down"
```

---

## 7. 备份与恢复

### 7.1 PostgreSQL备份策略

```bash
#!/bin/bash
# backup-postgres.sh - PostgreSQL自动备份脚本

# 配置
DB_HOST="postgres-master"
DB_PORT="5432"
DB_NAME="careercompass"
DB_USER="backup"
BACKUP_DIR="/backup/postgres"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/careercompass_${DATE}.sql"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

# 执行备份
echo "Starting PostgreSQL backup at $(date)"
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \
  --format=custom \
  --verbose \
  --file=${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}"
    
    # 压缩备份文件
    gzip ${BACKUP_FILE}
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # 上传到对象存储
    mc cp ${BACKUP_FILE}.gz minio/backup/postgres/
    
    # 清理本地旧备份
    find ${BACKUP_DIR} -name "careercompass_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "Old backups cleaned up (retention: ${RETENTION_DAYS} days)"
else
    echo "Backup failed!"
    exit 1
fi

# 发送通知
if command -v curl &> /dev/null; then
    curl -X POST "https://hooks.slack.com/services/xxx" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"PostgreSQL backup completed: ${BACKUP_FILE}.gz\"}"
fi

echo "Backup script finished at $(date)"
```

### 7.2 备份恢复操作

```bash
#!/bin/bash
# restore-postgres.sh - PostgreSQL恢复脚本

# 配置
DB_HOST="postgres-master"
DB_PORT="5432"
DB_NAME="careercompass"
DB_USER="postgres"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backup/postgres/careercompass_20240115_120000.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "==============================================="
echo "PostgreSQL Database Restore"
echo "==============================================="
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DB_NAME"
echo "Target host: $DB_HOST:$DB_PORT"
echo "==============================================="
echo ""

# 确认
read -p "Are you sure you want to restore? This will OVERWRITE the existing database! [y/N]: " confirm
if [[ $confirm != [yY] ]]; then
    echo "Restore cancelled."
    exit 0
fi

# 解压备份文件
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > /tmp/restore_backup.sql
    RESTORE_FILE="/tmp/restore_backup.sql"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# 停止应用连接（可选）
echo "Stopping application connections..."
PGPASSWORD=$(kubectl get secret career-secrets -n careercompass -o jsonpath='{.data.db-password}' | base64 -d)
export PGPASSWORD

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# 恢复数据库
echo "Restoring database..."
if pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v --clean --if-exists "$RESTORE_FILE"; then
    echo ""
    echo "==============================================="
    echo "Database restore completed successfully!"
    echo "==============================================="
else
    echo ""
    echo "==============================================="
    echo "Database restore failed!"
    echo "==============================================="
    exit 1
fi

# 清理临时文件
if [[ $BACKUP_FILE == *.gz ]]; then
    rm -f /tmp/restore_backup.sql
fi

echo ""
echo "Restore process completed at $(date)"
```

---

## 8. 安全加固

### 8.1 网络安全

```bash
# 防火墙配置脚本
#!/bin/bash
# security-hardening.sh - 安全加固脚本

echo "==============================================="
echo "CareerCompass AI Platform - Security Hardening"
echo "==============================================="

# 1. 配置防火墙规则
configure_firewall() {
    echo "[1/5] Configuring firewall rules..."
    
    # 安装 firewalld
    yum install -y firewalld
    systemctl start firewalld
    systemctl enable firewalld
    
    # 清除默认规则
    firewall-cmd --permanent --remove-service=ssh
    firewall-cmd --permanent --remove-service=dhcpv6-client
    
    # 允许SSH（限制来源IP）
    firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/8" service name="ssh" accept'
    
    # 允许Kubernetes端口
    firewall-cmd --permanent --add-port=6443/tcp      # K8s API
    firewall-cmd --permanent --add-port=10250/tcp     # Kubelet
    firewall-cmd --permanent --add-port=10251/tcp     # Kube-scheduler
    firewall-cmd --permanent --add-port=10252/tcp     # Kube-controller
    
    # 允许NodePort范围
    firewall-cmd --permanent --add-port=30000-32767/tcp
    
    # 允许Calico网络
    firewall-cmd --permanent --add-port=179/tcp
    firewall-cmd --permanent --add-port=4789/udp
    
    # 拒绝所有其他入站连接
    firewall-cmd --set-default-zone=drop
    
    # 重新加载防火墙
    firewall-cmd --reload
    
    # 查看防火墙状态
    firewall-cmd --list-all
    
    echo "[1/5] Firewall configuration completed."
}

# 2. 配置SELinux
configure_selinux() {
    echo "[2/5] Configuring SELinux..."
    
    # 安装SELinux管理工具
    yum install -y policycoreutils-python-utils setools-console
    
    # 设置SELinux为 enforcing 模式
    setenforce 1
    sed -i 's/SELINUX=permissive/SELINUX=enforcing/' /etc/selinux/config
    sed -i 's/SELINUX=disabled/SELINUX=enforcing/' /etc/selinux/config
    
    # 配置Docker的SELinux策略
    mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "selinux-enabled": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
    
    systemctl restart docker
    
    echo "[2/5] SELinux configuration completed."
}

# 3. 系统安全加固
harden_system() {
    echo "[3/5] Hardening system security..."
    
    # 安装安全工具
    yum install -y fail2ban aide rkhunter
    
    # 配置 fail2ban
    cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 3
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # 配置密码策略
    cat >> /etc/security/pwquality.conf <<EOF
minlen = 12
minclass = 3
maxrepeat = 2
gecoscheck = 1
enforce_for_root
EOF
    
    # 配置登录策略
    cat >> /etc/pam.d/system-auth <<EOF
auth        required      pam_faillock.so preauth silent audit deny=5 unlock_time=900
auth        [default=die] pam_faillock.so authfail audit deny=5 unlock_time=900
auth        sufficient    pam_faillock.so authsucc audit deny=5 unlock_time=900
EOF
    
    # 禁用不必要的服务
    systemctl disable --now rpcbind
    systemctl disable --now nfs-server
    
    # 配置审计
    auditctl -w /etc/passwd -p wa -k identity
    auditctl -w /etc/shadow -p wa -k identity
    auditctl -w /etc/group -p wa -k identity
    
    echo "[3/5] System hardening completed."
}

# 4. Docker安全加固
harden_docker() {
    echo "[4/5] Hardening Docker security..."
    
    # 配置Docker安全选项
    mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "userns-remap": "default",
  "live-restore": true,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "apparmor-default": "docker-default",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3",
    "labels": "production_status,environment"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "selinux-enabled": true,
  "iptables": true,
  "ip-forward": false,
  "bridge": "none"
}
EOF
    
    # 创建seccomp profile
    # 下载默认的docker seccomp profile并进行定制
    curl -o /etc/docker/seccomp.json https://raw.githubusercontent.com/moby/moby/master/profiles/seccomp/default.json
    
    # 重启Docker
    systemctl restart docker
    
    # 扫描镜像漏洞
    # 安装Trivy
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
    
    # 扫描镜像
    trivy image --exit-code 0 --no-progress careercompass/user-service:latest
    
    echo "[4/5] Docker hardening completed."
}

# 5. Kubernetes安全加固
harden_kubernetes() {
    echo "[5/5] Hardening Kubernetes security..."
    
    # 启用Pod Security Standards
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: careercompass
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
EOF
    
    # 配置Network Policy
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: careercompass
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
EOF
    
    # 创建允许特定流量的Network Policy
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-user-service
  namespace: careercompass
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
EOF
    
    # 启用RBAC审计日志
    # 编辑API Server配置
    # /etc/kubernetes/manifests/kube-apiserver.yaml
    # 添加: --audit-log-path=/var/log/audit.log
    #      --audit-log-maxage=30
    #      --audit-log-maxbackup=10
    #      --audit-log-maxsize=100
    #      --audit-policy-file=/etc/kubernetes/audit-policy.yaml
    
    # 配置Pod Security Admission
    kubectl apply -f - <<EOF
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingAdmissionPolicy
metadata:
  name: "pod-security.policy"
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
    - apiGroups: [""]
      apiVersions: ["v1"]
      operations: ["CREATE", "UPDATE"]
      resources: ["pods"]
  validations:
  - expression: "object.spec.containers.all(c, c.securityContext.allowPrivilegeEscalation == false)"
    message: "Containers must not allow privilege escalation"
  - expression: "object.spec.containers.all(c, c.securityContext.runAsNonRoot == true)"
    message: "Containers must run as non-root"
  - expression: "object.spec.containers.all(c, c.securityContext.seccompProfile.type == 'RuntimeDefault')"
    message: "Containers must use RuntimeDefault seccomp profile"
EOF
    
    echo "[5/5] Kubernetes hardening completed."
}

# 主函数
main() {
    echo "==============================================="
    echo "CareerCompass AI Platform - Security Hardening"
    echo "==============================================="
    echo ""
    
    configure_firewall
    configure_selinux
    harden_system
    harden_docker
    harden_kubernetes
    
    echo ""
    echo "==============================================="
    echo "Security hardening completed!"
    echo "==============================================="
    echo ""
    echo "Next steps:"
    echo "1. Review and customize security policies"
    echo "2. Enable audit logging"
    echo "3. Configure log forwarding"
    echo "4. Set up SIEM integration"
    echo "5. Schedule regular security scans"
    echo ""
}

# 运行主函数
main "$@"
```

### 8.2 定期安全扫描

```bash
#!/bin/bash
# security-scan.sh - 定期安全扫描脚本

SCAN_DATE=$(date +%Y%m%d_%H%M%S)
SCAN_DIR="/security/scans/${SCAN_DATE}"
mkdir -p ${SCAN_DIR}

echo "Starting security scan at $(date)"

# 1. 镜像漏洞扫描
echo "[1/5] Scanning container images..."
trivy image --format json --output ${SCAN_DIR}/trivy-images.json \
  careercompass/user-service:latest \
  careercompass/resume-service:latest \
  careercompass/ai-service:latest

# 2. 配置文件扫描
echo "[2/5] Scanning Kubernetes manifests..."
trivy config --format json --output ${SCAN_DIR}/trivy-config.json ./k8s/

# 3. 运行容器扫描
echo "[3/5] Scanning running containers..."
docker ps --format '{{.Names}}' | while read container; do
    trivy filesystem --scanners vuln,secret,misconfig \
        --format json --output ${SCAN_DIR}/trivy-fs-${container}.json \
        /var/lib/docker/overlay2/$(docker inspect -f '{{.GraphDriver.Data.MergedDir}}' $container | xargs basename)
done

# 4. 合规性扫描
echo "[4/5] Running CIS benchmark scan..."
kube-bench run --targets node,controlplane,etcd,policies \
    --outputfile ${SCAN_DIR}/kube-bench-results.json

# 5. 密钥扫描
echo "[5/5] Scanning for secrets..."
trufflehog filesystem ./ --json --output=${SCAN_DIR}/trufflehog-results.json

# 生成报告
echo "Generating scan report..."
cat > ${SCAN_DIR}/summary.txt <<EOF
Security Scan Report
====================
Scan Date: $(date)
Scan ID: ${SCAN_DATE}

Scans Performed:
1. Container Image Vulnerability Scan (Trivy)
2. Kubernetes Manifest Scan (Trivy)
3. Running Container Scan (Trivy)
4. CIS Benchmark Scan (kube-bench)
5. Secret Detection Scan (TruffleHog)

Results:
- High Severity Issues: $(grep -c "HIGH" ${SCAN_DIR}/trivy-images.json || echo 0)
- Medium Severity Issues: $(grep -c "MEDIUM" ${SCAN_DIR}/trivy-images.json || echo 0)
- Secrets Found: $(grep -c "Found result" ${SCAN_DIR}/trufflehog-results.json || echo 0)

Full results available in: ${SCAN_DIR}
EOF

# 发送通知
if [ -f /etc/security/webhook-url ]; then
    WEBHOOK_URL=$(cat /etc/security/webhook-url)
    curl -X POST ${WEBHOOK_URL} \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"Security scan completed. Summary: $(cat ${SCAN_DIR}/summary.txt)\"}"
fi

echo "Security scan completed. Results saved to: ${SCAN_DIR}"
```

---

## 9. 运维手册

### 9.1 日常巡检清单

```bash
#!/bin/bash
# daily-check.sh - 每日巡检脚本

echo "==============================================="
echo "CareerCompass AI - Daily System Check"
echo "Date: $(date)"
echo "==============================================="
echo ""

# 1. 节点状态检查
echo "[1/10] Checking Kubernetes nodes..."
kubectl get nodes -o wide
NODE_STATUS=$(kubectl get nodes | grep -c "Ready")
echo "✓ ${NODE_STATUS} nodes are ready"
echo ""

# 2. Pod状态检查
echo "[2/10] Checking Pod status..."
kubectl get pods -n careercompass --field-selector=status.phase!=Running
echo ""

# 3. 资源使用检查
echo "[3/10] Checking resource usage..."
kubectl top nodes
echo ""
kubectl top pods -n careercompass --sort-by=cpu
echo ""

# 4. 存储检查
echo "[4/10] Checking storage..."
kubectl get pvc -n careercompass
kubectl get pv
echo ""

# 5. 事件检查
echo "[5/10] Checking recent events..."
kubectl get events -n careercompass --sort-by='.lastTimestamp' | tail -20
echo ""

# 6. 服务状态检查
echo "[6/10] Checking service endpoints..."
kubectl get endpoints -n careercompass
echo ""

# 7. 备份状态检查
echo "[7/10] Checking backup status..."
LATEST_BACKUP=$(ls -t /backup/postgres/*.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600 ))
    echo "Latest backup: $LATEST_BACKUP"
    echo "Backup age: ${BACKUP_AGE} hours"
    if [ $BACKUP_AGE -gt 24 ]; then
        echo "⚠️ WARNING: Backup is older than 24 hours!"
    else
        echo "✓ Backup is up to date"
    fi
else
    echo "⚠️ WARNING: No backup files found!"
fi
echo ""

# 8. 证书检查
echo "[8/10] Checking SSL certificates..."
kubectl get certificates -n careercompass
kubectl describe certificate tls-secret -n careercompass 2>/dev/null || echo "No certificate found"
echo ""

# 9. 日志检查
echo "[9/10] Checking recent logs..."
echo "Recent errors in user-service:"
kubectl logs -n careercompass -l app=user-service --tail=50 2>/dev/null | grep -i "error\|exception\|fatal" | tail -10 || echo "No recent errors"
echo ""

# 10. 性能检查
echo "[10/10] Performance check..."
echo "Response time check:"
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://api.careercompass.ai/health || echo "API check failed"
echo ""

# 总结
echo "==============================================="
echo "Daily Check Summary"
echo "==============================================="
echo "Check time: $(date)"
echo "Total nodes: $(kubectl get nodes | grep -c Ready)"
echo "Total pods: $(kubectl get pods -n careercompass | wc -l)"
echo "Running pods: $(kubectl get pods -n careercompass | grep -c Running)"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Check Grafana dashboard for trends"
echo "3. Verify backup completed successfully"
echo "4. Document any issues in the incident log"
echo "==============================================="
```

### 9.2 故障处理流程

```
故障处理流程:

1. 故障发现
   - 监控告警
   - 用户反馈
   - 日常检查发现

2. 故障确认
   - 确认故障现象
   - 确定故障范围
   - 评估影响程度
   - 判断优先级

3. 故障处理
   紧急处理:
   - 启动应急预案
   - 执行故障转移
   - 降级/限流
   - 隔离故障节点
   
   根因修复:
   - 定位根本原因
   - 实施修复方案
   - 验证修复效果
   
4. 故障恢复
   - 逐步恢复服务
   - 验证功能正常
   - 监控稳定性
   - 解除告警

5. 故障复盘
   - 记录故障详情
   - 分析根本原因
   - 总结经验教训
   - 制定改进措施
   - 更新应急预案

故障分级标准:

P0 - 致命故障:
- 生产环境完全不可用
- 核心功能全部失效
- 数据安全受到威胁
- 响应时间: 15分钟内
- 处理时间: 2小时内恢复

P1 - 严重故障:
- 主要功能不可用
- 性能严重下降
- 部分用户受影响
- 响应时间: 30分钟内
- 处理时间: 4小时内恢复

P2 - 一般故障:
- 次要功能异常
- 轻微性能影响
- 个别用户反馈
- 响应时间: 2小时内
- 处理时间: 24小时内恢复

P3 - 轻微问题:
- 界面显示问题
- 建议性改进
- 不影响使用
- 响应时间: 1个工作日内
- 处理时间: 排期处理
```

---

## 10. 升级维护

### 10.1 版本升级流程

```bash
#!/bin/bash
# upgrade.sh - 版本升级脚本

set -e

VERSION=$1
ENV=$2

if [ -z "$VERSION" ] || [ -z "$ENV" ]; then
    echo "Usage: $0 <version> <environment>"
    echo "Example: $0 1.2.3 production"
    exit 1
fi

echo "==============================================="
echo "CareerCompass AI - Upgrade Process"
echo "==============================================="
echo "Version: $VERSION"
echo "Environment: $ENV"
echo "Date: $(date)"
echo "==============================================="
echo ""

# 1. 升级前检查
echo "[1/7] Pre-upgrade checks..."

# 检查集群健康
kubectl get nodes
kubectl get pods -n careercompass | grep -v Running

# 检查磁盘空间
df -h | grep -E "(Filesystem|/var|/data)"

# 检查备份状态
ls -lh /backup/postgres/*.gz | tail -5

echo "✓ Pre-upgrade checks completed"
echo ""

# 2. 数据库备份
echo "[2/7] Database backup..."

kubectl exec -it postgres-master-0 -n careercompass -- pg_dump -U career careercompass > /backup/pre-upgrade-${VERSION}-$(date +%Y%m%d).sql

echo "✓ Database backup completed: /backup/pre-upgrade-${VERSION}-$(date +%Y%m%d).sql"
echo ""

# 3. 应用更新
echo "[3/7] Updating application..."

# 更新镜像版本
kubectl set image deployment/user-service \
  user-service=careercompass/user-service:${VERSION} \
  -n careercompass

kubectl set image deployment/resume-service \
  resume-service=careercompass/resume-service:${VERSION} \
  -n careercompass

# 等待滚动更新完成
kubectl rollout status deployment/user-service -n careercompass --timeout=10m
kubectl rollout status deployment/resume-service -n careercompass --timeout=10m

echo "✓ Application update completed"
echo ""

# 4. 数据库迁移
echo "[4/7] Running database migrations..."

# 执行迁移脚本
kubectl run db-migrate-${VERSION} \
  --rm -i \
  --restart=Never \
  --image=careercompass/db-migrate:${VERSION} \
  --env="DB_HOST=postgres-master" \
  --env="DB_NAME=careercompass" \
  --env="DB_USER=career" \
  --env="DB_PASSWORD=$(kubectl get secret career-secrets -n careercompass -o jsonpath='{.data.db-password}' | base64 -d)"

echo "✓ Database migrations completed"
echo ""

# 5. 功能验证
echo "[5/7] Post-upgrade verification..."

# 健康检查
kubectl get pods -n careercompass
kubectl get svc -n careercompass

# API测试
curl -f http://api.careercompass.ai/health || exit 1
curl -f http://api.careercompass.ai/version || exit 1

# 数据库连接测试
kubectl exec -it postgres-master-0 -n careercompass -- psql -U career -d careercompass -c "SELECT version();"

echo "✓ Post-upgrade verification completed"
echo ""

# 6. 回滚准备
echo "[6/7] Preparing rollback capability..."

# 标记当前版本
kubectl annotate deployment/user-service \
  "previous-version=$(kubectl get deployment user-service -n careercompass -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')" \
  -n careercompass

echo "✓ Rollback capability prepared"
echo ""

# 7. 完成
echo "[7/7] Upgrade completed!"
echo ""
echo "==============================================="
echo "Upgrade Summary"
echo "==============================================="
echo "Version: $VERSION"
echo "Environment: $ENV"
echo "Completed: $(date)"
echo ""
echo "Next steps:"
echo "1. Monitor application metrics for 24 hours"
echo "2. Check error rates and response times"
echo "3. Verify all scheduled jobs are running"
echo "4. Update documentation"
echo "5. Notify users of new features (if applicable)"
echo ""
echo "Rollback command (if needed):"
echo "kubectl rollout undo deployment/user-service -n careercompass"
echo "==============================================="
```

### 10.2 回滚操作

```bash
# 快速回滚到上一个版本
kubectl rollout undo deployment/user-service -n careercompass

# 回滚到指定版本
kubectl rollout undo deployment/user-service --to-revision=3 -n careercompass

# 查看历史版本
kubectl rollout history deployment/user-service -n careercompass

# 查看回滚状态
kubectl rollout status deployment/user-service -n careercompass
```

---

**文档结束**

*平台部署手册 v1.0*  
*CareerCompass AI 运维团队*
