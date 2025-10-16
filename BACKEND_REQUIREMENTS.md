# Backend API Requirements for Enhanced Journal Tracking Flow

## Document Purpose
This document outlines the backend API enhancements needed to support the new three-step journal tracking flow in the Profile section. The frontend has been revamped with a professional UI that requires additional data persistence and retrieval capabilities.

---

## Current Available Endpoints (Working)

### ✅ Plant Tracking Endpoints
1. `GET /api/v1/tracking/timeline/{plant_id}` - Get growth stages template
2. `GET /api/v1/tracking/instance/{instance_id}` - Get instance details
3. `GET /api/v1/tracking/instance/{instance_id}/tips` - Get current tips
4. `PUT /api/v1/tracking/instance/{instance_id}/progress` - Update progress
5. `POST /api/v1/tracking/instance/{instance_id}/initialize-checklist` - Initialize checklist
6. `POST /api/v1/tracking/checklist/complete` - Mark checklist item complete
7. `POST /api/v1/tracking/instance/{instance_id}/start-growing` - Start growing
8. `POST /api/v1/tracking/instance/{instance_id}/auto-update-stage` - Auto-update stage
9. `DELETE /api/v1/tracking/instance/{instance_id}` - Delete instance
10. `GET /api/v1/tracking/requirements/{plant_id}` - Get plant requirements
11. `GET /api/v1/tracking/instructions/{plant_id}` - Get setup instructions

---

## 🔴 MISSING ENDPOINTS - HIGH PRIORITY

### 1. **Retrieve Checklist State for Instance**
**Endpoint**: `GET /api/v1/tracking/instance/{instance_id}/checklist`

**Purpose**: Retrieve the saved checklist state so users can see their progress when reopening the journal.

**Current Issue**:
- We can POST checklist updates via `/tracking/checklist/complete`
- But we CANNOT retrieve the saved state
- Users lose their checklist progress when they close and reopen

**Request**: None (just instance_id in path)

**Expected Response**:
```json
{
  "instance_id": 123,
  "checklist_items": [
    {
      "item_key": "tools::garden-trowel",
      "category": "Tools",
      "item_name": "Garden Trowel",
      "quantity": "1",
      "optional": false,
      "is_completed": true,
      "completed_at": "2025-10-14T10:30:00Z",
      "user_notes": null
    },
    {
      "item_key": "materials::potting-mix",
      "category": "Materials",
      "item_name": "Potting Mix",
      "quantity": "5L",
      "optional": false,
      "is_completed": false,
      "completed_at": null,
      "user_notes": null
    }
  ],
  "progress_summary": {
    "total_items": 15,
    "completed_items": 8,
    "completion_percentage": 53.33
  }
}
```

**Frontend Integration**:
- Call this endpoint in `loadDetailAndTips()` function
- Hydrate `checklistCompletedSet` ref with completed item keys
- Display progress bar with accurate completion percentage

---

### 2. **Mark Setup Instructions as Complete**
**Endpoint**: `POST /api/v1/tracking/instance/{instance_id}/complete-setup`

**Purpose**: Explicitly track when user completes Step 2 (Setup Instructions), separate from starting growth.

**Current Issue**:
- No explicit "setup complete" flag in the database
- We're inferring it from `is_active` (growing status)
- This creates confusion between "setup done" and "growth started"

**Request Body**:
```json
{
  "completed_at": "2025-10-14T10:45:00Z"
}
```

**Expected Response**:
```json
{
  "instance_id": 123,
  "setup_completed": true,
  "setup_completed_at": "2025-10-14T10:45:00Z",
  "message": "Setup instructions marked as complete"
}
```

**Database Schema Addition**:
Add to `plant_instances` table:
- `setup_completed` BOOLEAN DEFAULT FALSE
- `setup_completed_at` TIMESTAMP NULL

**Frontend Integration**:
- Call this when user clicks "Mark Setup Complete & Start Growing"
- Update `setupComplete` ref to true
- Show Step 3 (Timeline) after successful response

---

### 3. **Get Instance Status Summary**
**Endpoint**: `GET /api/v1/tracking/instance/{instance_id}/status`

**Purpose**: Get a quick summary of instance progress across all three steps.

**Request**: None (just instance_id in path)

**Expected Response**:
```json
{
  "instance_id": 123,
  "checklist_status": {
    "total_items": 15,
    "completed_items": 12,
    "completion_percentage": 80.0,
    "meets_threshold": true
  },
  "setup_status": {
    "completed": true,
    "completed_at": "2025-10-14T10:45:00Z"
  },
  "growing_status": {
    "is_active": true,
    "start_date": "2025-10-14",
    "days_elapsed": 5,
    "current_stage": "Germination",
    "progress_percentage": 15.5
  }
}
```

**Frontend Integration**:
- Call this when opening journal detail view
- Automatically determine which step to show:
  - If `growing_status.is_active` → Show Step 3
  - Else if `setup_status.completed` → Show Step 2
  - Else if `checklist_status.completion_percentage >= 80` → Show Step 2
  - Else → Show Step 1

---

## 🟡 ENHANCEMENT REQUESTS - MEDIUM PRIORITY

### 4. **Batch Update Checklist Items**
**Endpoint**: `POST /api/v1/tracking/instance/{instance_id}/checklist/batch`

**Purpose**: Update multiple checklist items in a single request (performance optimization).

**Request Body**:
```json
{
  "items": [
    {
      "item_key": "tools::garden-trowel",
      "is_completed": true
    },
    {
      "item_key": "materials::potting-mix",
      "is_completed": true
    },
    {
      "item_key": "materials::fertilizer",
      "is_completed": false
    }
  ]
}
```

**Expected Response**:
```json
{
  "instance_id": 123,
  "updated_count": 3,
  "progress_summary": {
    "total_items": 15,
    "completed_items": 10,
    "completion_percentage": 66.67
  }
}
```

---

### 5. **Enhanced Tips with Stage Context**
**Endpoint**: `GET /api/v1/tracking/instance/{instance_id}/tips?stage={stage_name}`

**Purpose**: Get stage-specific tips rather than just "current" tips.

**Current Issue**:
- `current_tips` in instance details only shows tips for current stage
- Users can't see tips for upcoming stages
- No way to get tips when revisiting earlier stages

**Request**: `stage` query parameter (optional)

**Expected Response**:
```json
{
  "instance_id": 123,
  "current_stage": "Germination",
  "requested_stage": "Seedling",
  "tips": [
    {
      "tip_id": 1,
      "stage_name": "Seedling",
      "category": "watering",
      "content": "Water lightly every 2-3 days",
      "priority": "high"
    },
    {
      "tip_id": 2,
      "stage_name": "Seedling",
      "category": "sunlight",
      "content": "Provide 4-6 hours of indirect sunlight",
      "priority": "medium"
    }
  ]
}
```

---

### 6. **Plant Instance Notes**
**Endpoint**: `PUT /api/v1/tracking/instance/{instance_id}/notes`

**Purpose**: Allow users to add general notes to their plant journal (separate from stage-specific notes).

**Request Body**:
```json
{
  "notes": "Plant is thriving! Moved to larger pot on Day 10."
}
```

**Expected Response**:
```json
{
  "instance_id": 123,
  "notes": "Plant is thriving! Moved to larger pot on Day 10.",
  "updated_at": "2025-10-14T11:00:00Z"
}
```

**Database Schema Addition**:
Add to `plant_instances` table:
- `general_notes` TEXT NULL

---

## 🟢 FUTURE ENHANCEMENTS - LOW PRIORITY

### 7. **Photo Upload for Stages**
**Endpoint**: `POST /api/v1/tracking/instance/{instance_id}/photos`

**Purpose**: Allow users to upload photos of their plant at each stage.

**Request Body** (multipart/form-data):
```
photo: [file]
stage_name: "Germination"
caption: "First sprout!"
```

**Expected Response**:
```json
{
  "photo_id": 456,
  "instance_id": 123,
  "stage_name": "Germination",
  "photo_url": "https://storage.googleapis.com/plantopia-images/user-uploads/123/456.jpg",
  "caption": "First sprout!",
  "uploaded_at": "2025-10-14T11:15:00Z"
}
```

---

### 8. **Timeline Event Logging**
**Endpoint**: `POST /api/v1/tracking/instance/{instance_id}/events`

**Purpose**: Log custom events in the plant's timeline (e.g., "Watered", "Fertilized", "Pruned").

**Request Body**:
```json
{
  "event_type": "watering",
  "description": "Gave plant a deep watering",
  "occurred_at": "2025-10-14T08:00:00Z"
}
```

**Expected Response**:
```json
{
  "event_id": 789,
  "instance_id": 123,
  "event_type": "watering",
  "description": "Gave plant a deep watering",
  "occurred_at": "2025-10-14T08:00:00Z",
  "day_number": 5
}
```

---

## Database Schema Changes Required

### Table: `plant_instances`
**Add Columns**:
```sql
ALTER TABLE plant_instances
ADD COLUMN setup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN setup_completed_at TIMESTAMP NULL,
ADD COLUMN general_notes TEXT NULL;
```

### Table: `checklist_items` (New Table)
```sql
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  instance_id INTEGER NOT NULL REFERENCES plant_instances(instance_id) ON DELETE CASCADE,
  item_key VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  item_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(50),
  optional BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  user_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_instance_item (instance_id, item_key)
);
```

### Table: `stage_tips` (Enhancement for future)
```sql
CREATE TABLE stage_tips (
  tip_id SERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL REFERENCES plants(plant_id),
  stage_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  content TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Implementation Priority

### **Phase 1** (CRITICAL - Needed Now):
1. `GET /api/v1/tracking/instance/{instance_id}/checklist` ⭐⭐⭐⭐⭐
2. `POST /api/v1/tracking/instance/{instance_id}/complete-setup` ⭐⭐⭐⭐⭐
3. `GET /api/v1/tracking/instance/{instance_id}/status` ⭐⭐⭐⭐

### **Phase 2** (Helpful, but UI works without them):
4. `POST /api/v1/tracking/instance/{instance_id}/checklist/batch` ⭐⭐⭐
5. `GET /api/v1/tracking/instance/{instance_id}/tips?stage={stage}` ⭐⭐⭐
6. `PUT /api/v1/tracking/instance/{instance_id}/notes` ⭐⭐

### **Phase 3** (Future features):
7. Photo upload endpoint ⭐
8. Timeline event logging ⭐

---

## Frontend Workarounds (Until Backend is Ready)

Until the backend endpoints are implemented, the frontend will:

1. **Checklist Persistence**:
   - Use `localStorage` to persist checklist state per instance
   - Key: `checklist:completed:{instance_id}`
   - Limitation: Won't sync across devices/browsers

2. **Setup Completion**:
   - Infer from `is_active` status
   - If `is_active === true`, assume setup is complete
   - Limitation: Can't distinguish between "setup done" and "growth started"

3. **Status Summary**:
   - Make multiple API calls on modal open:
     - `getPlantInstanceDetails()`
     - `getPlantRequirements()`
     - `getPlantInstructions()`
   - Calculate checklist percentage from localStorage
   - Limitation: Slower performance, no server-side validation

---

## Contact & Questions

If the backend team has questions about:
- Specific response formats
- Additional fields needed
- Edge cases or error handling
- Performance considerations

Please contact the frontend team for clarification before implementation.

---

**Document Version**: 1.0
**Date**: October 14, 2025
**Author**: Frontend Team (Plantopia)
**Status**: Pending Backend Review
