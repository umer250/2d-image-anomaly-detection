# 2D Image Anomaly Detection - REST API Documentation

**Base URL:** `http://localhost:8000/api/v1`  
**Authentication:** JWT Bearer Token (except where noted)

---

## Authentication Endpoints

### POST `/auth/login`
**Description:** OAuth2 compatible token login  
**Auth Required:** No  
**Content-Type:** `application/x-www-form-urlencoded`

**Request Body:**
```
username=user@gmail.com&password=SecurePass123!
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `400`: Incorrect email or password
- `400`: Inactive user

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@gmail.com&password=SecurePass123!"
```

---

### POST `/auth/signup`
**Description:** Register new user with strict validation  
**Auth Required:** No  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "newuser@gmail.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Validation Rules:**
- Email must end with `@gmail.com`
- Password: min 8 chars, 1 uppercase, 1 number, 1 special character

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "newuser@gmail.com",
  "full_name": "John Doe",
  "role": "user",
  "is_active": true,
  "created_at": "2026-04-22T10:30:00Z"
}
```

**Errors:**
- `400`: Email must be @gmail.com
- `400`: Password validation failed
- `400`: User already exists

---

### POST `/auth/forgot-password`
**Description:** Generate 6-digit OTP and send via email  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@gmail.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If this email exists, a 6-digit OTP has been sent."
}
```

**Note:** OTP expires in 5 minutes. Check console logs for OTP in development.

---

### POST `/auth/verify-otp`
**Description:** Verify 6-digit OTP  
**Auth Required:** No

**Query Parameters:**
- `email` (required): User email
- `otp` (required): 6-digit code

**Response (200 OK):**
```json
{
  "message": "OTP verified successfully",
  "token": "123456"
}
```

**Errors:**
- `400`: Invalid OTP code
- `400`: OTP has expired

---

### POST `/auth/reset-password`
**Description:** Reset password using verified OTP token  
**Auth Required:** No

**Request Body:**
```json
{
  "token": "123456",
  "new_password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successful. Please login with your new password."
}
```

---

## User Endpoints

### GET `/users/me`
**Description:** Get current user information  
**Auth Required:** Yes (User or Admin)

**Response (200 OK):**
```json
{
  "id": 3,
  "email": "user@gmail.com",
  "full_name": "John Doe",
  "role": "user",
  "is_active": true,
  "avatar_url": null,
  "created_at": "2026-04-20T08:15:00Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/users/dashboard`
**Description:** Get user's personal dashboard statistics  
**Auth Required:** Yes (User or Admin)

**Response (200 OK):**
```json
{
  "totalImages": 45,
  "anomaliesDetected": 12,
  "normalImages": 33,
  "accuracy": 98.5,
  "history": [
    {"name": "Mon", "count": 5},
    {"name": "Tue", "count": 8},
    {"name": "Wed", "count": 3}
  ],
  "distribution": [
    {"name": "Minor", "value": 4},
    {"name": "Major", "value": 5},
    {"name": "Critical", "value": 3}
  ],
  "userId": 3
}
```

---

### PUT `/users/profile`
**Description:** Update user's own profile  
**Auth Required:** Yes (User or Admin)

**Request Body:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": 3,
  "email": "user@gmail.com",
  "full_name": "John Smith",
  "avatar_url": "https://example.com/avatar.jpg",
  "role": "user",
  "is_active": true
}
```

---

### POST `/users/verify-password`
**Description:** Verify current password  
**Auth Required:** Yes (User or Admin)

**Request Body:**
```json
{
  "password": "CurrentPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password verified successfully"
}
```

**Errors:**
- `400`: Incorrect password

---

### PUT `/users/change-password`
**Description:** Change user's password  
**Auth Required:** Yes (User or Admin)

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Errors:**
- `400`: Incorrect current password

---

## Admin Endpoints

### GET `/admin/users`
**Description:** Get all users with pagination  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `skip` (optional, default: 0): Number of records to skip
- `limit` (optional, default: 100): Max records to return

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "email": "user1@gmail.com",
    "full_name": "Alice Johnson",
    "role": "user",
    "is_active": true,
    "created_at": "2026-04-15T09:00:00Z"
  },
  {
    "id": 3,
    "email": "user2@gmail.com",
    "full_name": "Bob Smith",
    "role": "user",
    "is_active": true,
    "created_at": "2026-04-16T10:30:00Z"
  }
]
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/admin/users?skip=0&limit=50" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

### POST `/admin/users`
**Description:** Create new user (Admin only)  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "email": "newuser@gmail.com",
  "password": "SecurePass123!",
  "full_name": "New User",
  "role": "user"
}
```

**Response (200 OK):**
```json
{
  "id": 10,
  "email": "newuser@gmail.com",
  "full_name": "New User",
  "role": "user",
  "is_active": true
}
```

---

### PUT `/admin/users/{user_id}`
**Description:** Update user details  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "full_name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "user@gmail.com",
  "full_name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

---

### DELETE `/admin/users/{user_id}`
**Description:** Delete user (soft delete)  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

**Errors:**
- `400`: Cannot delete your own account
- `404`: User not found

---

### GET `/admin/analytics`
**Description:** Get system analytics  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
{
  "total_users": 25,
  "total_images": 450,
  "total_anomalies_detected": 120,
  "active_users": 22,
  "daily_activity": [5, 8, 12, 7, 9, 15, 11],
  "weekly_activity": [45, 52, 48, 60, 55, 58, 62],
  "monthly_activity": [180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345],
  "anomaly_trends": [30, 35, 28, 40, 38, 42, 45, 48, 50, 52, 55, 58],
  "type_distribution": {
    "critical": 35,
    "minor": 50,
    "noise": 35
  },
  "recent_high_risk": [
    {
      "id": 123,
      "user": "John Doe",
      "email": "john@gmail.com",
      "score": 92.5,
      "timestamp": "2026-04-22T14:30:00Z"
    }
  ],
  "model_version": "v2.5.0-LTS"
}
```

---

### GET `/admin/images`
**Description:** Get all uploaded images from all users  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `skip` (optional, default: 0)
- `limit` (optional, default: 100)

**Response (200 OK):**
```json
{
  "total": 150,
  "images": [
    {
      "id": 45,
      "filename": "bottle_001.jpg",
      "file_path": "/static/uploads/abc123.jpg",
      "upload_date": "2026-04-22T10:15:00Z",
      "user_id": 3,
      "category": "bottle",
      "results": [
        {
          "id": 67,
          "anomaly_score": 0.8542,
          "is_anomaly": true,
          "heatmap_path": "/static/heatmaps/heatmap_abc123.png",
          "threshold": 0.7544,
          "model_version": "PatchCore-WideResNet50-v1"
        }
      ]
    }
  ]
}
```

---

### GET `/admin/stats`
**Description:** Get dashboard summary statistics  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
{
  "total_users": 25,
  "total_predictions": 450,
  "anomaly_count": 120,
  "normal_count": 330,
  "anomaly_rate": 26.67,
  "predictions_per_category": {
    "bottle": {"count": 200, "anomaly_count": 50},
    "cable": {"count": 100, "anomaly_count": 30},
    "capsule": {"count": 150, "anomaly_count": 40}
  },
  "activity_last_7_days": [
    {"date": "2026-04-16", "count": 45},
    {"date": "2026-04-17", "count": 52},
    {"date": "2026-04-18", "count": 48}
  ]
}
```

---

### GET `/admin/categories`
**Description:** Get all 15 MVTec AD categories with training status, AUROC scores, and model paths  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "bottle",
    "model_path": "ml_models/bottle_patchcore_model.pkl",
    "threshold": 0.7544,
    "i_auroc": 0.9912,
    "p_auroc": 0.9867,
    "is_trained": true,
    "created_at": "2026-04-22T10:00:00Z"
  },
  {
    "id": 2,
    "name": "cable",
    "threshold": 0.8200,
    "is_trained": true,
    "created_at": "2026-04-22T10:00:00Z"
  }
]
```

---

### GET `/admin/settings`
**Description:** Get system notification settings for current admin  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
{
  "notification_enabled": 1
}
```

---

### PUT `/admin/settings`
**Description:** Update notification settings  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "notification_enabled": 0
}
```

**Response (200 OK):**
```json
{
  "message": "Settings updated"
}
```

---

### POST `/admin/system-params`
**Description:** Soft-reset system (clears physical files, keeps DB records)  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `password` (required): System password (default: "12345")

**Response (200 OK):**
```json
{
  "message": "System reset successful. 489 physical files removed. Database records preserved."
}
```

**Errors:**
- `400`: Invalid system password

---

### POST `/admin/wipe-all-users`
**Description:** Deactivate all non-admin users  
**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `password` (required): System password (default: "12345")

**Response (200 OK):**
```json
{
  "message": "Successfully deactivated 24 non-admin users. Records preserved in database."
}
```

---

### GET `/admin/system-params`
**Description:** Get live system parameters including thresholds  
**Auth Required:** Yes (Admin only)

**Response (200 OK):**
```json
{
  "categories": {
    "bottle": {
      "threshold": 0.7544,
      "is_trained": true
    },
    "cable": {
      "threshold": 0.8200,
      "is_trained": true
    }
  },
  "notification_enabled": 1,
  "model_version": "PatchCore-WideResNet50-v1"
}
```

---

### PUT `/admin/system-params`
**Description:** Update live system parameters  
**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "category": "bottle",
  "threshold": 0.8000,
  "notification_enabled": 1
}
```

**Response (200 OK):**
```json
{
  "message": "System parameters updated",
  "updated": {
    "threshold": 0.8000,
    "category": "bottle"
  }
}
```

---

## ML Endpoints

### GET `/ml/health`
**Description:** Check ML service health  
**Auth Required:** No

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "anomaly-detection-ml"
}
```

---

### GET `/ml/model-info`
**Description:** Get model information  
**Auth Required:** No

**Response (200 OK):**
```json
{
  "model_name": "PatchCore",
  "model_version": "PatchCore-WideResNet50-v1",
  "framework": "PyTorch",
  "description": "2D Image Anomaly Detection using K-NN PatchCore features",
  "valid_categories": ["bottle", "cable", "capsule", "..."]
}
```

---

### GET `/ml/model-status`
**Description:** Check which categories have trained models  
**Auth Required:** No

**Response (200 OK):**
```json
{
  "available_models": ["bottle", "bottle_latest", "bottle_v2"],
  "total_trained": 3,
  "total_categories": 17,
  "all_categories": ["bottle", "cable", "capsule", "..."]
}
```

---

### GET `/ml/model-threshold`
**Description:** Get threshold for a specific category  
**Auth Required:** No

**Query Parameters:**
- `category` (optional, default: "bottle"): Category name

**Response (200 OK):**
```json
{
  "category": "bottle",
  "threshold": 0.7544
}
```

---

### POST `/ml/predict`
**Description:** Run anomaly detection on uploaded image  
**Auth Required:** Yes (User or Admin)  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): Image file (JPG, PNG, WEBP, max 20MB)
- `category` (optional, default: "bottle"): MVTec category
- `remove_bg` (optional, default: false): Enable background removal

**Response (200 OK):**
```json
{
  "image_id": 45,
  "history_id": 123,
  "anomaly_score": 0.8542,
  "is_anomaly": true,
  "heatmap_path": "/static/heatmaps/heatmap_abc123.png",
  "hot_map_path": "/static/heatmaps/heatmap_abc123_hot.png",
  "contour_path": "/static/heatmaps/heatmap_abc123_contour.png",
  "comparison_path": "/static/heatmaps/comparison_heatmap_abc123.png",
  "original_path": "/static/uploads/abc123.jpg",
  "threshold": 0.7544,
  "category": "bottle",
  "model_version": "PatchCore-WideResNet50-v1",
  "image_quality": {
    "blur_score": 125.5,
    "is_blurry": false,
    "message": null
  },
  "inference_time_ms": 312.5,
  "total_time_ms": 420.1,
  "processed_at": "2026-04-26T10:15:32.000000+00:00"
}
```

**Errors:**
- `400`: Invalid category
- `503`: Model not trained for category

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/ml/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@bottle_test.jpg" \
  -F "category=bottle" \
  -F "remove_bg=false"
```

---

### POST `/ml/calibrate`
**Description:** Recalibrate threshold using normal reference images  
**Auth Required:** Yes (User or Admin)  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `category` (required): Category name
- `percentile` (optional, default: 95.0): Percentile for threshold (0-100)
- `files` (optional): Array of known-normal images

**Response (200 OK):**
```json
{
  "category": "bottle",
  "new_threshold": 0.7544,
  "percentile_used": 95.0,
  "num_samples": 50,
  "score_min": 0.1234,
  "score_max": 0.9876,
  "score_mean": 0.5432,
  "method": "uploaded_normal_images"
}
```

---

## History Endpoint

### GET `/history`
**Description:** Get upload history  
**Auth Required:** Yes (User or Admin)

**Query Parameters:**
- `skip` (optional, default: 0)
- `limit` (optional, default: 100)

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "user_id": 3,
    "filename": "bottle_001.jpg",
    "file_path": "/static/uploads/abc123.jpg",
    "status": "Anomaly",
    "score": 0.8542,
    "heatmap_path": "/static/heatmaps/heatmap_abc123.png",
    "hot_map_path": "/static/heatmaps/heatmap_abc123_hot.png",
    "contour_path": "/static/heatmaps/heatmap_abc123_contour.png",
    "comparison_path": "/static/heatmaps/comparison_heatmap_abc123.png",
    "threshold": 0.7544,
    "model_version": "PatchCore-WideResNet50-v1",
    "category": "bottle",
    "upload_date": "2026-04-22T10:15:00Z"
  }
]
```

**Note:** Users see only their own history; admins see all history.

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions. Admin access required."
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error message"
}
```

---

## JWT Token Structure

**Payload:**
```json
{
  "sub": "user@gmail.com",
  "user_id": 3,
  "role": "user",
  "exp": 1714654800
}
```

**Expiry:** 30 minutes  
**Header:** `Authorization: Bearer <token>`

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

---

## CORS Configuration

**Allowed Origins:** `*` (all origins)  
**Allowed Methods:** `*` (all methods)  
**Allowed Headers:** `*` (all headers)  
**Credentials:** `false`

**Note:** In production, restrict CORS to specific origins.

---

## File Upload Limits

- **Max file size:** 20 MB
- **Allowed formats:** JPG, JPEG, PNG, WEBP
- **Upload directory:** `static/uploads/`
- **Heatmap directory:** `static/heatmaps/`

---

## Database Schema

### Users Table
- `id` (INTEGER, PK)
- `email` (VARCHAR, UNIQUE)
- `hashed_password` (VARCHAR)
- `full_name` (VARCHAR)
- `role` (VARCHAR: "user" | "admin")
- `is_active` (BOOLEAN)
- `avatar_url` (VARCHAR, nullable)
- `reset_token` (VARCHAR, nullable)
- `reset_token_expiry` (DATETIME, nullable)
- `created_at` (DATETIME)

### Images Table
- `id` (INTEGER, PK)
- `filename` (VARCHAR)
- `file_path` (VARCHAR)
- `upload_date` (DATETIME)
- `user_id` (INTEGER, FK → users.id)

### Results Table
- `id` (INTEGER, PK)
- `image_id` (INTEGER, FK → images.id)
- `anomaly_score` (FLOAT)
- `threshold` (FLOAT)
- `is_anomaly` (BOOLEAN)
- `heatmap_path` (VARCHAR)
- `model_version` (VARCHAR)
- `details` (JSON)
- `created_at` (DATETIME)

### History Table
- `id` (INTEGER, PK)
- `user_id` (INTEGER, FK → users.id)
- `filename` (VARCHAR)
- `file_path` (VARCHAR)
- `status` (VARCHAR: "Normal" | "Anomaly")
- `score` (FLOAT)
- `heatmap_path` (VARCHAR)
- `hot_map_path` (VARCHAR, nullable)
- `contour_path` (VARCHAR, nullable)
- `comparison_path` (VARCHAR, nullable)
- `threshold` (FLOAT)
- `model_version` (VARCHAR)
- `category` (VARCHAR)
- `created_at` (DATETIME)

### User_Settings Table
- `id` (INTEGER, PK)
- `user_id` (INTEGER, FK → users.id, UNIQUE)
- `theme` (VARCHAR, default: "dark")
- `notification_enabled` (INTEGER, default: 1)
- `default_model` (VARCHAR, default: "bottle")

---

## Testing the API

### 1. Register a new user
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test123!","full_name":"Test User"}'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@gmail.com&password=Test123!"
```

### 3. Get user info
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Upload image for analysis
```bash
curl -X POST http://localhost:8000/api/v1/ml/predict \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test_image.jpg" \
  -F "category=bottle"
```

### 5. Get history
```bash
curl -X GET http://localhost:8000/api/v1/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/anomaly_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_STR=/api/v1
PROJECT_NAME=2D Anomaly Detection API

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## Running the Backend

```bash
cd Backend
pip install -r requirements.txt
alembic upgrade head
# Set admin env vars first, then start the server:
# Windows: set ADMIN_EMAIL=admin@anomalydetect.io & set ADMIN_PASSWORD=Admin@2026FYP!
# Linux:   export ADMIN_EMAIL=admin@anomalydetect.io ADMIN_PASSWORD=Admin@2026FYP!
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> The server auto-seeds all 15 categories and creates the admin account on first startup.

**API Docs:** http://localhost:8000/docs  
**Health Check:** http://localhost:8000/health

---

## Admin Account Policy

- Admin accounts **cannot** be created via the public `/auth/signup` endpoint.
- Admin is bootstrapped via environment variables `ADMIN_EMAIL` + `ADMIN_PASSWORD` on server startup.
- For manual bootstrapping: `python scripts/seed_admin.py`
- Default admin email: `admin@anomalydetect.io` (set in `.env`)
- **Rotate the password immediately after first login in production.**

---

*Last Updated: April 26, 2026*
