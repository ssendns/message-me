# message-me

**a full-stack real-time chat app** featuring authentication, user roles, WebSocket-powered messaging, and a custom-designed interface. everything you see here is handcrafted: frontend, backend, database, and the live communication layer.

---

## why this project?

i wanted to go beyond just building a typical CRUD app. this is a fully functional **real-time messaging platform**, built to demonstrate:

- my ability to structure full-stack applications,
- handle real-time data with WebSockets,
- implement secure auth flows and role management,
- design a clear, responsive user interface

---

## key features

- **user authentication** with sessions & JWT
- **role-based access control** (member / admin / owner)
- **real-time messaging** via Socket.io
- **message storage** in PostgreSQL via Prisma
- **image upload** via Cloudinary
- **backend unit tests** (jest)
- **group chat** functionality with group management
- **admin and owner tools** for group management
- **responsive UI** with React 19 + Tailwind

---

## tech stack

### backend

- Node.js + Express (REST API)
- PostgreSQL + Prisma ORM
- Cloudinary SDK
- WebSockets (Socket.io)
- JWT + sessions

### frontend

- React 19 (with hooks & Context API)
- Tailwind CSS
- React Router
- Socket.io-client

## additional tools and libraries

- bcryptjs for password hashing
- zod for input validation
- multer for handling image uploads
- jest + supertes for backend testing
- lucide-react for modern icon system

---

## next steps

- add typing indicators and last seen status
- create pinned messages
- add message reactions and stickers
- enable more profile customization (bio, email etc.)
- polish mobile UI experience

---

## what i learned

- state management in real-time apps
- designing user flows across multiple roles
- integrating third-party tools like Cloudinary
- writing clean, testable, and maintainable backend code

## personal note

i am currently planning to build a fully functional social media/dating app called **meet-me** (in progress). before diving into that, i wanted to build something more focused to gain confidence and experience with real-time systems.

originally, message-me was supposed to be a small warm-up project — but honestly, i enjoyed the process so much and just could not stop building. i kept adding features, refining the architecture, and experimenting with UI. it became a project i am truly proud of.

---

i am currently building out my portfolio — learning fast, building fast, and refining my craft every day. if this project speaks to you, feel free to [connect with me](https://github.com/ssendns). i am always open to collaborating on cool, meaningful projects.
