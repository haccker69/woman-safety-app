# Where is data stored?

All app data (users, guardians, complaints, etc.) is stored in **MongoDB**. The connection is configured in your backend.

## Configuration

- **File:** `backend/.env`
- **Variable:** `MONGODB_URI`

Current value in your project:

```env
MONGODB_URI=mongodb://localhost:27017/women_safety_db
```

This means:

| Part | Meaning |
|------|--------|
| `localhost` | MongoDB is expected on your **local machine** |
| `27017` | Default MongoDB port |
| `women_safety_db` | **Database name** where all data is stored |

## Collections (tables) in `women_safety_db`

Mongoose creates collections automatically when you first insert data:

| Collection name | What it stores |
|-----------------|----------------|
| `users` | User accounts (name, email, phone, **guardians** array, address, location) |
| `complaints` | Filed complaints |
| `policestations` | Police stations (if any) |
| `admins` | Admin accounts |
| `police` | Police accounts (if using a separate model) |

So **user data and guardian data** are inside the **`users`** collection. Each user document has a **`guardians`** array field.

## Why you might not see data in local MongoDB

1. **MongoDB is not running**
   - The app connects only when the server starts. If MongoDB isn’t running, the backend will fail to start (e.g. “MongoServerSelectionError” or “connect ECONNREFUSED”).
   - **Fix:** Start MongoDB locally (e.g. `brew services start mongodb-community` on Mac, or start “MongoDB Server” from your installer).

2. **You’re looking in the wrong database**
   - Data is in the database **`women_safety_db`**, not in `test` or `admin`.
   - **Fix:** In MongoDB Compass or `mongosh`, switch to database **`women_safety_db`** and check the **`users`** collection.

3. **Wrong connection string**
   - If `MONGODB_URI` is overridden (e.g. by another `.env` or a cloud URI), the app will use that instead of localhost.
   - **Fix:** Ensure `backend/.env` has exactly:
     ```env
     MONGODB_URI=mongodb://localhost:27017/women_safety_db
     ```
   - Restart the backend after changing `.env`.

## How to verify

1. **Start MongoDB** (if you use it as a local service):
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   ```
   Or start MongoDB the way you normally do on your system.

2. **Start the backend** from `backend` folder:
   ```bash
   npm run dev
   ```
   You should see: **`MongoDB Connected: localhost`** (or similar). If you see a connection error, MongoDB is not reachable.

3. **Check the database:**
   - **MongoDB Compass:** Connect to `mongodb://localhost:27017` → open database **`women_safety_db`** → open collection **`users`**. You should see user documents (and inside them, **`guardians`** arrays).
   - **mongosh:**
     ```bash
     mongosh
     use women_safety_db
     db.users.find().pretty()
     ```

4. **Create data from the app:** Register a new user or log in and add a guardian. Then refresh the `users` collection in Compass or run `db.users.find()` again; you should see the new or updated document.

## Summary

- **Where:** Local MongoDB at `localhost:27017`, database **`women_safety_db`**.
- **User/guardian data:** In the **`users`** collection; guardians are stored in each user’s **`guardians`** array.
- **If you don’t see data:** Ensure MongoDB is running, the backend starts without connection errors, and you’re looking at the database **`women_safety_db`** and the **`users`** collection.
