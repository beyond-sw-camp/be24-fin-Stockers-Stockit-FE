
<div align="center">

# 📦 STOCKIT Frontend

<br/>

```
 ███████╗████████╗ ██████╗  ██████╗██╗  ██╗██╗████████╗
 ██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝██║╚══██╔══╝
 ███████╗   ██║   ██║   ██║██║     █████╔╝ ██║   ██║   
 ╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ██║   ██║   
 ███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗██║   ██║   
 ╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝   ╚═╝   
```

### 지속 가능한 SPA 브랜드를 위한 **ESG 스마트 재고관리 시스템**

<br/>

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI/CD-D24939?style=flat-square&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-Search-005571?style=flat-square&logo=elasticsearch&logoColor=white)](https://www.elastic.co/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Driven-231F20?style=flat-square&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)

<br/>

[![Frontend](https://img.shields.io/badge/🖥_Frontend_Repository-현재_레포-4FC08D?style=for-the-badge)](https://github.com/your-org/stockit-frontend)
[![Backend](https://img.shields.io/badge/⚙️_Backend_Repository-바로가기-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://github.com/your-org/stockit-backend)

<br/>

> *버려질 뻔했던 악성 재고는 새로운 원자재 자산이 되고,*  
> *기업의 일상적인 재고 결정들이 모여, 대시보드 속 울창한 숲이 됩니다.*  
> **— STOCKIT 프로젝트 비전**

<br/>

</div>

---

## 👥 팀 소개

<div align="center">

|  |  |  |  |
|:---:|:---:|:---:|:---:|
| <a href="https://github.com/saralove20"><img src="https://github.com/saralove20.png" width="80" height="80" style="border-radius:50%"/></a> | <a href="https://github.com/pbgodsoo"><img src="https://github.com/pbgodsoo.png" width="80" height="80" style="border-radius:50%"/></a> | <a href="https://github.com/sarapoba"><img src="https://github.com/sarapoba.png" width="80" height="80" style="border-radius:50%"/></a> | <a href="https://github.com/sunyeoplee0"><img src="https://github.com/sunyeoplee0.png" width="80" height="80" style="border-radius:50%"/></a> |
| **김사라** | **박범수** | **이후경** | **이선엽** |
| [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/saralove20) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/pbgodsoo) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/sarapoba) | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/sunyeoplee0) |

</div>

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [개발 배경](#-개발-배경)
- [설계 문서](#-설계-문서)
- [요구사항 정의서](#-요구사항-정의서)
- [핵심 기능](#-핵심-기능)
- [활용 데이터](#-활용-데이터)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [화면 캡처 및 기능 시연](#-화면-캡처-및-기능-시연)
- [무중단 배포 (Blue-Green)](#-무중단-배포-blue-green)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)

---

## 🌿 프로젝트 소개

**STOCKIT**은 SPA(Specialty store retailer of Private label Apparel) 브랜드의 고질적인 재고 문제를 **데이터**와 **ESG** 관점으로 풀어낸 차세대 통합 재고관리 시스템입니다.

패스트패션 산업에서 매년 수백만 벌의 의류가 소각되는 현실 속에서, STOCKIT은 단순한 ERP를 넘어 재고를 *버려야 할 쓰레기*가 아닌 **다시 순환될 수 있는 새로운 자원**으로 바라보고 **재고를 자산으로 전환**하는 새로운 패러다임을 제시합니다. 발주·출고·입고·판매·순환(업사이클링)에 이르는 재고의 라이프사이클 전 과정을 단일 플랫폼에서 추적·관리합니다.

| 항목 | 내용 |
|------|------|
| **프로젝트 기간** | 2026.04.10 ~ 2026.06.08 (60일) |
| **타겟 산업** | SPA 브랜드 / 패션 리테일 기업 |
| **시스템 유형** | ERP 연동형 통합 재고관리 시스템 (MSA 기반) |
| **팀원** | 김사라, 박범수, 이후경, 이선엽 |
| **핵심 고객** | 이랜드월드, 삼성물산 패션부문, 코오롱FnC, FRL코리아(유니클로), 자라리테일코리아 등 의류 SPA 브랜드 및 의류 산업 |

---

## 🔥 개발 배경

### 패스트패션 산업의 구조적 문제

SPAO, 유니클로, ZARA, H&M 등 SPA 브랜드는 짧은 주기로 대량의 의류를 기획·생산·판매합니다. 이 구조는 심각한 환경 문제를 야기합니다.

```
🌍 패션 산업 = 전 세계 탄소 배출량의 10%, 폐수 발생의 20%
👕 연간 생산 1,000억 벌 중 73%가 소각 또는 매립 처리
♻️ 37만여 톤 섬유 폐기물 중 단 5%만 재활용
📈 삼성물산 패션부문 재고 소각량: 2022년 94톤 → 2023년 97톤 → 2024년 129톤 (매년 증가)
```

### 관리 시스템의 부재

> *"한 번도 사용하지 않은 재고 의류를 소각하는 건 의류 산업 종사자들 사이에서 공공연한 비밀"*

2023년 **순환경제사회 전환 촉진법**이 제정됐음에도 재고 폐기 문제 영역에는 여전히 커다란 공백이 존재합니다. 기존 시스템들은 재고의 입출고·판매 흐름을 관리하는 데만 집중되어 있어, **팔리지 않은 악성 재고의 '이후'를 책임지는 시스템이 없습니다.** STOCKIT은 이 공백을 채웁니다.

### 규제 압력의 3방향 포위

핵심 고객인 패션 기업들은 K-ETS 직접 규제 대상이 아님에도 세 방향의 동시 압박을 받고 있습니다.

```
① EU 공급망 실사 지침 (CSDDD)   — 글로벌 바이어가 공급망 Scope 3 감축 데이터 요구 시작
② ESG 공시 의무화 압력           — 데이터 없이는 대응 불가
③ KOC(탄소배출권) 수익화 기회     — 대응하면 오히려 수익이 생기는 구조
```

---

## 📐 설계 문서

| 문서 | 링크 | 설명 |
|------|------|------|
| 📊 요구사항 정의서 | [Google Sheets 바로가기](https://docs.google.com/spreadsheets/d/17QbE5SdqWqJu-REsKzx1ct_r4Z_lNkBvFaoIoWybhEc/edit?gid=1613754341#gid=1613754341) | 역할별 기능·비기능 요구사항, 우선순위, 검증 기준 |
| 🎨 화면 설계서 | [Figma 바로가기](https://www.figma.com/design/zDcSTD8tNvZb3m5yjZPurb/%EC%A0%9C%EB%AA%A9-%EC%97%86%EC%9D%8C?node-id=0-1&t=LZgIMCGwJqqVEE7R-1) | 역할별 주요 화면 레이아웃 및 기능 흐름 Wireframe |
| 🏗️ 시스템 아키텍처 | [시스템 아키텍처 바로가기](#-시스템-아키텍처) | 전체 시스템 아키텍처 |

---

## 📄 요구사항 정의서

> 📎 [요구사항 정의서 전체 문서 (Google Sheets)](https://docs.google.com/spreadsheets/d/17QbE5SdqWqJu-REsKzx1ct_r4Z_lNkBvFaoIoWybhEc/edit?gid=1613754341#gid=1613754341)

STOCKIT의 사용자는 역할과 권한에 따라 **3가지 역할**로 분류됩니다.

### 👤 역할 및 권한 범위

| 역할 | 영문명 | 권한 범위 |
|------|--------|-----------|
| 본사 관리자 | `CentralManager` | 전체 매장 및 물류창고 통합 관제, 제품 관리, 공급사 발주, 재고 이동 지시, 순환 재고 관리 |
| 매장 관리자 | `StoreManager` | 개별 매장 재고 관리, 판매, 발주 요청, 입고 처리, 통계 조회 |
| 물류창고 관리자 | `WarehouseManager` | 창고 입출고 처리, 피킹 리스트 관리, 창고 재고 현황 모니터링 |

### ✅ 기능 요구사항 요약

<details>
<summary><strong>🏪 매장 관리자 (StoreManager)</strong></summary>

| ID | 기능 | 우선순위 |
|----|------|---------|
| SM-01 | 매장 내 실시간 재고 수량 조회 | ★★★ |
| SM-02 | 물류창고 → 매장 입고 처리 및 검수 | ★★★ |
| SM-03 | 판매 처리 및 재고 차감 반영 | ★★★ |
| SM-04 | 발주 요청 (품목 필터링, 수량 입력) | ★★★ |
| SM-05 | 매장 통계 조회 (판매량, 회전율) | ★★☆ |

</details>

<details>
<summary><strong>🏢 본사 관리자 (CentralManager)</strong></summary>

| ID | 기능 | 우선순위 |
|----|------|---------|
| CM-01 | 전체 매장·창고 통합 재고 조회 | ★★★ |
| CM-02 | 공급사 발주 관리 | ★★★ |
| CM-03 | 창고 간 재고 이동 지시 | ★★★ |
| CM-04 | 순환 재고 후보 조회 및 전환 처리 | ★★★ |
| CM-05 | AI 기반 최적 거래처 자동 매칭 | ★★★ |
| CM-06 | 전사 ESG 지표 대시보드 | ★★☆ |
| CM-07 | 알림 및 공지사항 관리 | ★★☆ |

</details>

<details>
<summary><strong>🏭 물류창고 관리자 (WarehouseManager)</strong></summary>

| ID | 기능 | 우선순위 |
|----|------|---------|
| WM-01 | 공급 → 창고 입고 처리 및 검수 | ★★★ |
| WM-02 | 피킹 리스트 조회 및 체크 | ★★★ |
| WM-03 | 매장 출고 처리 | ★★★ |
| WM-04 | 창고별 재고 현황 및 비교 조회 | ★★☆ |
| WM-05 | 가용 재고 / 안전 재고 현황 모니터링 | ★★☆ |

</details>

### 🔧 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **성능** | 재고 조회 응답 시간 ≤ 1초 (Redis 캐싱 적용) |
| **가용성** | 서비스 가동률 99.9% 이상 (무중단 배포) |
| **동시성** | Redis 분산 락을 통한 재고 수량 동시성 제어 |
| **보안** | JWT 기반 역할별 인증·인가 (RBAC) |
| **확장성** | MSA 구조로 서비스별 독립 배포·확장 |

---

## ✨ 핵심 기능

### 1️⃣ 순환 재고 시스템 — *악성 재고를 순환 자산으로*

> 버려질 위기의 장기 미판매 재고를 폐기하는 대신 **업사이클링 자산**으로 전환합니다.

**순환 재고 판별 3대 핵심 지표**

```
📅 기간 기준   → 입고 후 24개월 이상 판매 실적 없는 품목 자동 감지
📦 재고량 기준 → 현재 재고가 안전재고 대비 초과 누적된 SKU인 경우
💹 판매 가능성 → 극단 사이즈 재고 또는 특정 컬러 재고에 편중된 SKU (재고)
```

**재고 라이프사이클 전 과정 추적**

```
발주 ──→ 입고 ──→ 판매 ──→ [악성 재고 감지] ──→ 순환 전환 ──→ 업사이클링 판매
                                    ↑
                         3대 지표 자동 판별 엔진
```

**AI 기반 거래처 자동 매칭 (AX 매칭 엔진)**

순환 재고 소재 정보와 공공데이터 기반 거래처 DB를 NLP 임베딩 후 **코사인 유사도**로 최적 거래처 Top-N 자동 추천

```
소재 정보 벡터화  ──┐
                    ├──→ 유사도 연산 ──→ 최적 거래처 Top-N 추천 ──→ AI 활용 거래처 추천 사유 작성 
거래처 DB 벡터화  ──┘    (Cosine Similarity)
  (공장현황 + 사회적기업 목록 + KSIC 11차 분류)
```

- 카테고리 / 서브카테고리 정밀 필터링
- 업사이클링 업체로의 판매 등록까지 **원스톱 처리**

---

### 2️⃣ ESG 대시보드 — *재고 데이터가 ESG 성과로*

> 재고 관리를 하는 것만으로 ESG 공시 데이터가 **자동 생성**됩니다.

**주요 KPI 지표**

| 지표 | 설명 |
|------|------|
| 실제 탄소 감축량 (tCO₂) | 순환 재고 전환으로 소각 방지한 탄소량 |
| 연간 탄소 배출권 현황 | 배출 한도 vs 실적 비교 (기후에너지환경부 사전할당량 기준) |
| 탄소 배출권 환산 가치 (₩) | KAU 시세 실시간 연동 (금융위 배출권 API) |
| ESG 점수 | 소재별 탄소 계수 기반 누적 점수 (10단계 레벨) |
| 순환 재고 판매 수익 | 업사이클링 거래로 창출된 직접 수익 |
| 지역 상생 점수 | 지역 기반 소규모 파트너 / 사회적기업과의 거래 시 자동 부여 |
| 순환 거래 확산 점수 | 신규 거래처와 첫 순환 거래 발생 시 자동 부여 |

- 🌳 **게이미피케이션**: ESG 점수에 따라 묘목 → 거목으로 성장하는 디지털 나무 인터페이스

---

### 3️⃣ 실시간 재고 통합 관제 — *매장·창고를 한 화면에서*

> 전국 매장과 물류창고의 재고를 **단일 화면**에서 통합 모니터링합니다.

- **창고별 재고 비교**: 실재고 / 가용재고 / 안전재고를 한눈에
- **재고 상태 자동 태깅**: `정상` / `부족` / `품절` 3단계 자동 판별
- **Kafka 이벤트 드리븐**: 입출고 이벤트 실시간 반영 (예정)
- **SSE(Server-Sent Events)**: 화면 새로고침 없이 실시간 알림 수신
- **재고 부족 알림**: 설정된 적정 재고 수준(최소 7일치 판매량 등) 미만 시 자동 경보

---

## 📡 활용 데이터

STOCKIT은 신뢰성 높은 공공·민간 데이터를 연동하여 정밀한 탄소 감축 정량화와 거래처 매칭을 구현합니다.

### 공공 데이터

| 데이터 | 출처 | 활용 목적 |
|--------|------|-----------|
| 전국등록공장현황 | 한국산업단지공단 (공공데이터포털 REST API) | 순환 재고 수요처 거래처 DB 구축 |
| 사회적기업 목록 | 고용노동부 (공공데이터포털 CSV) | 지역 상생 거래처 인프라 구축 |
| 한국표준산업분류 KSIC (11차 개정) | 국가통계포털 (KOSIS) | 거래처 산업군 분류 정확도 확보 |
| 일반상품시세정보 (배출권시세) | 금융위원회 Open API | KAU 탄소 배출권 시세 실시간 연동 |
| KAU 한국배출권 가격 동향 | KRX 한국거래소 | 탄소 감축량 원화 환산 가치 표출 |
| 소각 탄소계수 (IPCC Vol.5) | GIR 온실가스종합정보센터 | 의류 폐기 시 탄소 배출량 산정 |

### 민간 데이터

| 데이터 | 출처 | 활용 목적 |
|--------|------|-----------|
| Higg MSI (Material Sustainability Index) | Higg (글로벌 민간 플랫폼) | 섬유 소재별 원천 탄소 발자국 |
| DEFRA UK2025 탄소환산계수 | DEFRA (영국 환경부) | 물류 이동 배출량 산정 |

---

## 🛠 기술 스택

```
Frontend
├── Framework     Vue.js 3.x (Composition API)
├── Build Tool    Vite
├── State         Pinia
├── Routing       Vue Router
└── HTTP Client   Axios

Infrastructure
├── Containerize  Docker
├── Orchestration Kubernetes (K8s)
├── CI/CD         Jenkins + ArgoCD
├── Cloud         AWS (EC2, S3, RDS, ElastiCache)
└── Deploy        Blue-Green Deployment (무중단)

Backend (연동)
├── Framework     Spring Boot (MSA)
├── Message Queue Apache Kafka (이벤트 드리븐)
├── Cache         Redis (캐싱 + 분산 락)
├── Search        Elasticsearch (순환 재고 검색)
└── Database      MariaDB (영구 저장)
```

---

## 🏗 시스템 아키텍처

<img width="1399" height="846" alt="image" src="https://github.com/user-attachments/assets/75005ffa-88dc-4288-bb4b-f98a65c273ec" />

---

## 📸 화면 캡처 및 기능 시연

### 🖥 주요 화면

#### 본사 대시보드 — 전사 통합 관제
<!-- 📷 캡처 이미지 삽입 -->
<img width="6110" height="3010" alt="image" src="https://github.com/user-attachments/assets/dbe0f5ef-bd27-4234-b47e-038ca3a94cab" />
<br></br>

#### 순환 재고 조회 — 소재 조건 필터링 + AI 거래처 매칭
<!-- 📷 캡처 이미지 삽입 -->
> 순환 재고 판매 등록 (SKU 선택)
<img width="6142" height="2934" alt="image" src="https://github.com/user-attachments/assets/5cabc4b7-2a04-4c40-8eb2-bc760f3ae1af" />
<br></br>

>순환 재고 판매 등록 (Step1 선택 SKU 확인)
<img width="6142" height="2944" alt="image" src="https://github.com/user-attachments/assets/612a8378-6c69-46c2-9f7c-a807b313e6dc" />
<br></br>

>순환 재고 판매 등록 (Step2 거래처 선택)
<img width="6216" height="2952" alt="image" src="https://github.com/user-attachments/assets/d65a4e7e-afa7-4a5e-87d5-44b90df1fec3" />
<br></br>

> 순환 재고 판매 등록 (AI 거래처 매칭)
<img width="6142" height="2938" alt="image" src="https://github.com/user-attachments/assets/2922faf5-818b-4f8f-94f8-d1662e2ddba1" />
<br></br>

> 순환 재고 판매 등록 (Step3 판매 조건 확정)
<img width="6202" height="2956" alt="image" src="https://github.com/user-attachments/assets/82bbfa3b-6246-4389-b455-957e404944b6" />
<br></br>

---

#### ESG 대시보드 — 탄소 감축 지표 & 나무 성장 인터페이스
<!-- 📷 캡처 이미지 삽입 -->
<img width="6392" height="3046" alt="image" src="https://github.com/user-attachments/assets/c9c50945-cd63-4784-b306-9319d0064a17" />
<img width="6548" height="3106" alt="image" src="https://github.com/user-attachments/assets/d6f76468-0c11-4cab-bee3-f9d1a854656f" />
<br></br>

#### 순환 재고 판매 통계
<!-- 📷 캡처 이미지 삽입 -->
<img width="6084" height="2866" alt="image" src="https://github.com/user-attachments/assets/c86a186a-7c7e-4dde-9730-3e0f294f189b" />
<br></br>

#### 창고별 재고 이동 화면
<!-- 📷 캡처 이미지 삽입 -->
<img width="6084" height="2984" alt="image" src="https://github.com/user-attachments/assets/c6e2d53f-3c0b-4027-bed4-4b80faacb45a" />
<br></br>

#### 매장 발주 화면
<!-- 📷 캡처 이미지 삽입 -->
<img width="6482" height="3104" alt="image" src="https://github.com/user-attachments/assets/764bd56a-09cf-481e-84b9-78dba01b1f13" />
<br></br>

---

### 🎬 기능 시연 영상

#### 🔐 로그인 · 회원가입
> 회원가입 → 본사 승인 → 사번 기반 로그인 흐름

<video src="assets/videos/auth.mp4" controls width="100%"></video>

<!-- 💡 대체:
[![로그인 · 회원가입](https://img.shields.io/badge/▶_시연_영상_보기-auth-4FC08D?style=for-the-badge)](assets/videos/auth.mp4)
-->

https://github.com/user-attachments/assets/97c48a2b-73ba-49ec-a469-cab561414222

---

#### 🌿 ESG 대시보드
> 탄소 감축량 시각화, KAU 환산 가치, 나무 성장 인터페이스

<video src="assets/videos/esg_dashboard.mp4" controls width="100%"></video>

<!-- 💡 대체:
[![ESG 대시보드](https://img.shields.io/badge/▶_시연_영상_보기-esg__dashboard-4FC08D?style=for-the-badge)](assets/videos/esg_dashboard.mp4)
-->

---

#### 📦 실시간 알림
> SSE 기반 실시간 재고 부족 알림 수신

<video src="https://github.com/user-attachments/assets/c4cc7866-f568-412b-8656-6e17ab6df80e" controls width="100%"></video>

<!-- 💡 대체:
[![실시간 재고 알림](https://img.shields.io/badge/▶_시연_영상_보기-realtime__alert-4FC08D?style=for-the-badge)](assets/videos/realtime_alert.mp4)
-->

---
> SSE 기반 실시간 재고 품절 알림 수신

<video src="https://github.com/user-attachments/assets/e0d38680-78ed-488f-aeb6-a83f1cd2d069" controls width="100%"></video>

<!-- 💡 대체:
[![실시간 재고 알림](https://img.shields.io/badge/▶_시연_영상_보기-realtime__alert-4FC08D?style=for-the-badge)](assets/videos/realtime_alert.mp4)
-->

---
> SSE 기반 실시간 계정 신청 알림 수신

<video src="https://github.com/user-attachments/assets/263eaeea-937e-4c55-9629-c33ee6352c27" controls width="100%"></video>

<!-- 💡 대체:
[![실시간 재고 알림](https://img.shields.io/badge/▶_시연_영상_보기-realtime__alert-4FC08D?style=for-the-badge)](assets/videos/realtime_alert.mp4)
-->

---

#### 🏭 피킹 리스트 처리
> 창고 관리자의 피킹 → 출고 처리 흐름

<video src="assets/videos/picking_list.mp4" controls width="100%"></video>

<!-- 💡 대체:
[![피킹 리스트 처리](https://img.shields.io/badge/▶_시연_영상_보기-picking__list-4FC08D?style=for-the-badge)](assets/videos/picking_list.mp4)
-->

---


#### 🛒 공급처 발주
> 본사가 거래처에 상품 발주 → 승인 → 배송 상태 추적

<video src="assets/videos/purchase_order.mp4" controls width="100%"></video>

<!-- 💡 대체:
[![공급처 발주](https://img.shields.io/badge/▶_시연_영상_보기-purchase__order-4FC08D?style=for-the-badge)](assets/videos/purchase_order.mp4)
-->
https://github.com/user-attachments/assets/여기에_공급처발주_영상링크_붙여넣기

---

#### 🏬 매장 재고 조회
> 매장별 SKU 재고 및 판매 가능 상태 실시간 조회

<video src="https://github.com/user-attachments/assets/6cf7fa99-78bd-4b11-9c0e-5b99ff30a1ee" controls width="100%"></video>

<!-- 💡 대체:
[![매장 재고 조회](https://img.shields.io/badge/▶_시연_영상_보기-store__inventory-4FC08D?style=for-the-badge)](assets/videos/store_inventory.mp4)
-->

---

#### 🏢 전사 재고 조회
> 본사 전사 차원의 매장·창고 통합 재고 현황 조회

<video src="https://github.com/user-attachments/assets/32ed5d6b-aa82-4c56-b6f2-3494ffb79cf4" controls width="100%"></video>

<!-- 💡 대체:
[![전사 재고 조회](https://img.shields.io/badge/▶_시연_영상_보기-company__inventory-4FC08D?style=for-the-badge)](assets/videos/company_inventory.mp4)
-->

---

#### 📥 창고 입고 관리
> 본사 발주·이동 지시 기반 창고 입고 예정 확인 및 입고 확정

<video src="https://github.com/user-attachments/assets/bdef0a20-8c0b-406b-a2dc-dee6b038305c" controls width="100%"></video>

<!-- 💡 대체:
[![창고 입고 관리](https://img.shields.io/badge/▶_시연_영상_보기-warehouse__inbound-4FC08D?style=for-the-badge)](assets/videos/warehouse_inbound.mp4)
-->

---

#### 🏭 창고 재고 조회
> 개별 물류창고 내 상품 보관 상태 및 실시간 가용 재고 상세 조회

<video src="https://github.com/user-attachments/assets/feed38e8-30e3-4224-8dc1-a51713c03028" controls width="100%"></video>

<!-- 💡 대체:
[![창고 재고 조회](https://img.shields.io/badge/▶_시연_영상_보기-warehouse__inventory-4FC08D?style=for-the-badge)](assets/videos/warehouse_inventory.mp4)
-->

---

#### 🔀 창고 간 재고 이동
> 창고 A 과잉 → 창고 B 부족 재고 이동 지시

<video src="assets/videos/stock_transfer.mp4" controls width="100%"></video>

<!-- 💡 대체:
[![창고 간 재고 이동](https://img.shields.io/badge/▶_시연_영상_보기-stock__transfer-4FC08D?style=for-the-badge)](assets/videos/stock_transfer.mp4)
-->
https://github.com/user-attachments/assets/d9933389-f1e8-4733-865c-2fcc5f5c11d1

---

#### 🗺️ 매장-창고 정보 관리
> 매장별 주 물류창고·예비 창고 매핑 + 발주 라우팅 기준 관리

<video src="https://github.com/user-attachments/assets/1e94191e-caf0-4c49-994e-74b2bfc7adfc" controls width="100%"></video>

<!-- 💡 대체:
[![매장-창고 정보 관리](https://img.shields.io/badge/▶_시연_영상_보기-store__warehouse__map-4FC08D?style=for-the-badge)](assets/videos/store_warehouse_map.mp4)
-->

---

#### 🤝 순환 재고 거래처 조회
> 순환재고 판매 거래처 목록·상세 조회 (소상공인 / 사회적기업 / 일반)

<video src="https://github.com/user-attachments/assets/2445d12a-0ee0-4d7e-9fc4-259698cc171f" controls width="100%"></video>

<!-- 💡 대체:
[![순환 재고 거래처 조회](https://img.shields.io/badge/▶_시연_영상_보기-circular__buyer-4FC08D?style=for-the-badge)](assets/videos/circular_buyer.mp4)
-->

---














## 🚀 무중단 배포 (Blue-Green)

STOCKIT은 **서비스 중단 없는 배포**를 위해 Kubernetes 기반 **Blue-Green Deployment** 전략을 채택했습니다.

### Blue-Green 방식을 선택한 이유

| 이유 | 설명 |
|------|------|
| **다운타임 Zero** | Blue가 트래픽을 유지하는 동안 Green을 준비 → K8s Service selector 한 줄 변경으로 즉시 전환, 사용자 입장에서 중단 없음 |
| **즉각 롤백** | 문제 발생 시 selector를 Blue로 되돌리면 끝 — 롤링 방식처럼 파드를 순차 교체할 필요 없음 |
| **버전 혼재 없음** | 항상 한 버전만 트래픽을 처리 → 구버전·신버전이 동시에 요청을 받는 상황 자체가 발생하지 않음 |
| **배포 전 충분한 검증** | Green을 띄운 상태에서 트래픽 전환 전에 Readiness Probe · Smoke Test를 충분히 수행 가능 |
| **배포 타이밍 리스크 최소화** | 트래픽 집중 시간대에도 배포 가능 — Green 준비가 완료된 시점에 스위칭하므로 타이밍에 자유로움 |

### Blue-Green 무중단 배포 시연 영상

https://github.com/user-attachments/assets/eda0b0f8-1787-4872-b0bc-e74ee383d204


### 배포 프로세스

```
1. 🟩 Green 환경에 새 버전 배포
   └── 기존 Blue 환경은 계속 트래픽 처리 중 (사용자 영향 없음)

2. 🧪 Green 환경 Health Check & Smoke Test
   └── Readiness Probe 통과 시에만 다음 단계 진행

3. 🔀 트래픽 전환 (Blue → Green, 무중단)
   └── K8s Service selector 변경 (downtime = 0)

4. 🟦 Blue 환경 유지 (롤백 대비)
   └── 이슈 발생 시 즉시 Blue로 재전환 가능
```

### CI/CD 파이프라인

```
GitHub Push (main branch)
    │
    ▼
Jenkins Pipeline
    ├── 1. 소스 빌드 (npm run build)
    ├── 2. 단위 테스트 실행
    ├── 3. Docker 이미지 빌드 & ECR 푸시
    ├── 4. ArgoCD Sync 트리거
    └── 5. K8s Blue-Green 전환
            ├── Green 파드 배포
            ├── Readiness Probe 헬스체크
            └── Service selector 전환 (Blue → Green)
```

## 📁 프로젝트 구조

```
stockit-frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/              # 정적 리소스 (이미지, 폰트)
│   ├── components/          # 공통 컴포넌트
│   │   ├── common/          # 버튼, 인풋, 모달 등
│   │   ├── dashboard/       # 대시보드 위젯
│   │   └── charts/          # ESG 차트 컴포넌트
│   ├── views/               # 페이지 컴포넌트
│   │   ├── store/           # 매장 관리자 화면
│   │   ├── hq/              # 본사 관리자 화면
│   │   │   ├── CircularInventory/   # 순환 재고 관리
│   │   │   └── EsgDashboard/        # ESG 대시보드
│   │   └── warehouse/       # 물류창고 관리자 화면
│   ├── stores/              # Pinia 상태 관리
│   ├── router/              # Vue Router 설정
│   ├── api/                 # API 통신 모듈
│   ├── composables/         # Vue Composables
│   └── utils/               # 유틸리티 함수
├── Dockerfile
├── nginx.conf
├── k8s/
│   ├── deployment-blue.yaml
│   ├── deployment-green.yaml
│   └── service.yaml
├── Jenkinsfile
├── .env.example
├── vite.config.js
└── package.json
```

---

## ⚡ 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

### 로컬 개발 환경 설정

```bash
# 1. 레포지토리 클론
git clone https://github.com/your-org/stockit-frontend.git
cd stockit-frontend

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에서 API 서버 주소 수정

# 4. 개발 서버 실행
npm run dev
# → http://localhost:5173
```

### 빌드 및 도커 실행

```bash
# 프로덕션 빌드
npm run build

# Docker 이미지 빌드
docker build -t stockit-frontend:latest .

# Docker 컨테이너 실행
docker run -p 80:80 stockit-frontend:latest
```

### 환경 변수

```env
VITE_API_BASE_URL=https://api.stockit.com
VITE_WS_URL=wss://api.stockit.com
VITE_APP_ENV=production
```

---

<div align="center">

**STOCKIT** — 재고를 자산으로, 기업의 일상을 위대한 ESG 성과로.

*© 2026 Stockers Team. All rights reserved.*

</div>
