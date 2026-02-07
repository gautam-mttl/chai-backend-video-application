# 🎬 Video Tube

A **complex backend application built with JavaScript** that powers a video-hosting platform similar to YouTube.

- [Project Model / Architecture](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

---

## 📌 Summary

This project is a **full-fledged backend system** built using **Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, and other modern technologies**.  
It includes all essential backend features required for a scalable application.

The platform supports:

- User Login & Signup  
- Video Upload & Management  
- Likes & Dislikes  
- Comments & Replies  
- Subscribe / Unsubscribe  
- Secure Authentication & Authorization  

The project follows **industry-standard practices** such as **JWT authentication, password hashing, access tokens, refresh tokens, and environment-based configuration**.

Significant effort has been invested in building this project, making it a strong **learning resource for backend development**.


---

## ⚙️ Run Locally

```bash
npm install
npm run dev
```

---


## 🔐 Environment Variables

Create a `.env` file in the root directory and add:

```
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🗂 Project Structure

```
src/
 ├── routes/
 ├── controllers/
 ├── models/
 ├── middlewares/
 └── utils/
```

---


## 📚 Dependencies

| Package | Purpose |
|--------|---------|
| bcrypt | Password hashing |
| cloudinary | Image & video storage |
| cookie-parser | Cookie handling |
| cors | Cross-origin requests |
| dotenv | Environment variables |
| express | Web framework |
| jsonwebtoken | JWT authentication |
| mongoose | MongoDB ORM |
| mongoose-aggregate-paginate-v2 | Pagination |
| multer | File uploads |
| nodemon | Auto server restart |
| prettier | Code formatting |


---

## 📜 License
This project is licensed under the **ISC License**.

---

## ⭐ Support and Acknowledgment
For questions, suggestions, or bugs, please create an **Issue** in this repository.
If you found this project helpful, consider giving it a **star**

---

