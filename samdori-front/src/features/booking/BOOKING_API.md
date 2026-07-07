# 예약(Booking) API 명세

백엔드에서 구현해야 할 REST API입니다. 프론트는 `src/features/booking/api/bookings.js`에서 이 경로를 호출합니다.

Base URL: `{API_BASE_URL}/api/bookings`

## 공통

### Booking 응답 객체

```json
{
  "id": 1,
  "clientId": 10,
  "clientName": "김내담",
  "counselorId": 3,
  "counselorName": "이상담",
  "date": "2026-06-20",
  "timeSlot": "10:00-11:00",
  "status": "PENDING",
  "requestedAt": "2026-06-19T09:30:00",
  "respondedAt": null,
  "cancelledAt": null,
  "cancelReason": null,
  "cancelledBy": null
}
```

### status 값

| 값 | 설명 |
|---|---|
| `PENDING` | 승인 대기 |
| `ACCEPTED` | 상담사 수락 |
| `REJECTED` | 상담사 거절 |
| `CANCELLED` | 취소됨 (내담자 또는 상담사) |

스네이크 케이스(`client_id`, `time_slot` 등)로 내려줘도 프론트에서 변환합니다.

### 에러 응답

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

HTTP 4xx/5xx 또는 `success: false` 시 프론트는 `message`를 사용자에게 표시합니다.

---

## 1. 예약 요청 생성 (내담자)

**POST** `/api/bookings`

### Request Body

```json
{
  "clientId": 10,
  "counselorId": 3,
  "date": "2026-06-20",
  "timeSlot": "10:00-11:00"
}
```

### Response

- `201` + Booking 객체, 또는 `{ "success": true, "data": Booking }`

### 백엔드 검증

- 해당 `counselorId`의 `date` + `timeSlot`이 availability에 등록되어 있는지
- 동일 슬롯에 `PENDING` / `ACCEPTED` 예약이 없는지
- `clientId`, `counselorId` 유효 사용자인지

---

## 2. 내담자 예약 목록

**GET** `/api/bookings/client?clientId={clientId}`

### Response

- Booking 배열, 또는 `{ "data": Booking[] }`

최신 요청 순(`requestedAt` desc) 정렬 권장.

---

## 3. 상담사 예약 요청 목록

**GET** `/api/bookings/counselor?counselorId={counselorId}`

### Response

- Booking 배열, 또는 `{ "data": Booking[] }`

---

## 4. 예약 수락 (상담사)

**PATCH** `/api/bookings/{bookingId}/accept`

### Request Body

```json
{
  "counselorId": 3
}
```

### Response

- 갱신된 Booking 객체

### 백엔드 검증

- `status === PENDING` 일 때만
- 요청의 `counselorId`와 body의 `counselorId` 일치

---

## 5. 예약 거절 (상담사)

**PATCH** `/api/bookings/{bookingId}/reject`

### Request Body

```json
{
  "counselorId": 3
}
```

### Response

- 갱신된 Booking 객체

---

## 6. 예약 취소 (내담자 / 상담사)

**PATCH** `/api/bookings/{bookingId}/cancel`

### Request Body (내담자)

```json
{
  "clientId": 10,
  "reason": "일정이 변경되었습니다."
}
```

### Request Body (상담사)

```json
{
  "counselorId": 3,
  "reason": "개인 사정으로 취소합니다."
}
```

`clientId` 또는 `counselorId` 중 하나만 보냅니다. `reason`은 필수(공백 불가)입니다.

### Response

- 갱신된 Booking 객체 (`status: CANCELLED`, `cancelReason`, `cancelledAt`, `cancelledBy` 포함 권장)

### 백엔드 검증

- `status`가 `PENDING` 또는 `ACCEPTED` 일 때만
- 아직 지나지 않은 일정(`date` + `timeSlot` 종료 시각 > now)일 때만
- 요청의 `clientId` / `counselorId`와 body 값 일치
- 취소 시 상대방에게 푸시 알림 발송 권장

---

## DB 테이블 예시

```sql
bookings (
  id            BIGINT PK,
  client_id     BIGINT NOT NULL,
  counselor_id  BIGINT NOT NULL,
  date          DATE NOT NULL,
  time_slot     VARCHAR(20) NOT NULL,
  status        VARCHAR(20) NOT NULL,
  requested_at  TIMESTAMP NOT NULL,
  responded_at  TIMESTAMP NULL,
  cancelled_at  TIMESTAMP NULL,
  cancel_reason VARCHAR(500) NULL,
  cancelled_by  VARCHAR(20) NULL
)
```

`client_name`, `counselor_name`은 users 테이블 JOIN으로 조회해 응답에 포함하면 됩니다.
