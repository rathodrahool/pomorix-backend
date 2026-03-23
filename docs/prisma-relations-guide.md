# Prisma ORM: Relationships & Core Concepts Guide

This guide is designed to help you understand the core concepts of Prisma ORM, with a strong focus on **Database Relationships**—the "How" and the "Why". 

---

## 1. Why Do We Need Relationships?

In relational databases (like PostgreSQL), data is stored in separate tables to avoid duplication and keep data organized (this is called *normalization*). 

**The "Why":** 
If a `User` has multiple `Todos`, storing all todos inside the `User` table directly is inefficient and hard to manage. Instead, we create a separate `Todos` table and **link** (relate) them to the `User`. 

Prisma makes it incredibly easy to define these links in your `schema.prisma` file and fetch linked data via the Prisma Client.

---

## 2. The Three Main Types of Relationships (The "How")

### A. One-to-Many (1:n) Relation
This is the **most common** relationship. 
**Example:** A User has many Todos, but each Todo belongs to exactly one User.

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique

  // 1:n - A user can have MANY todos (notice the array [])
  todos Todo[] 
}

model Todo {
  id      String @id @default(uuid())
  title   String
  
  // This is the Foreign Key (the column in the DB that stores the User's ID)
  user_id String 

  // The @relation attribute tells Prisma HOW everything connects.
  // It says: "The user_id field in this table references the id field in the User table."
  user    User   @relation(fields: [user_id], references: [id])
}
```
**How to Query it in Code:**
```typescript
// Fetch a user AND all their todos in one query!
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
  include: { todos: true } // This tells Prisma to fetch the related data
});
```

---

### B. One-to-One (1:1) Relation
**Example:** A User has exactly one Profile (which contains extra info like bio or avatar).

**The "Why":** You might split User and Profile into two tables so the `User` table stays lightweight (e.g., just for authentication), while optional data lives in `Profile`.

```prisma
model User {
  id      String   @id @default(uuid())
  email   String   @unique
  
  // 1:1 - A user has exactly ONE profile (NOT an array)
  profile Profile? 
}

model Profile {
  id      String @id @default(uuid())
  bio     String
  
  // Foreign Key
  user_id String @unique // IMPORTANT: @unique makes this a 1:1 relation!

  // Relation definition
  user    User   @relation(fields: [user_id], references: [id])
}
```
*Note the `@unique` constraint on `user_id`. Without it, a User could have multiple Profiles, making it a 1:n relation instead of 1:1.*

---

### C. Many-to-Many (m:n) Relation
**Example:** A Post can have many Categories, and a Category can belong to many Posts.

**The "Why":** You need to link multiple items to multiple other items. In standard SQL, you have to create a 3rd "Join Table" manually. Prisma gives you a magical **Implicit Many-to-Many** where it handles the join table for you!

```prisma
model Post {
  id         String     @id @default(uuid())
  title      String
  
  // Notice the array []
  categories Category[] 
}

model Category {
  id    String @id @default(uuid())
  name  String

  // Notice the array [] here too!
  posts Post[] 
}
```
**How to Query it in Code (Nested Writes):**
```typescript
// Create a new Post and instantly connect it to existing categories
const newPost = await prisma.post.create({
  data: {
    title: 'How to use Prisma',
    categories: {
      connect: [{ id: 'cat-1' }, { id: 'cat-2' }]
    }
  }
});
```

---

## 3. Other Crucial Prisma Concepts

### A. `@map` and `@@map` (Database Naming vs Code Naming)
Sometimes your Database Administrator wants tables named `users_table` and columns named `first_name`, but in your TypeScript code, you want them to be `User` and `firstName` (camelCase).

```prisma
// @@map renames the TABLE in the database, but keeps the model name 'User' in code
model User {
  id        String @id @default(uuid())
  firstName String @map("first_name") // @map renames the COLUMN in the database

  @@map("users_table") 
}
```

### B. Soft Deletes (`@updatedAt` & `@default(now())`)
These attributes automatically handle timestamps for you.

```prisma
model Record {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())   // Automatically sets to current time on creation
  updated_at DateTime  @updatedAt        // Automatically updates every time this row is modified
  deleted_at DateTime? // Optional (nullable). If this has a date, we treat it as "soft deleted"
}
```

### C. Referential Actions (OnDelete)
What happens to a User's Todos when the User is deleted?

```prisma
model Todo {
  id      String @id
  user_id String
  
  // onDelete: Cascade means "If the User is deleted, delete all their Todos too!"
  // onDelete: SetNull means "If the User is deleted, set user_id to null but keep the Todo"
  user    User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

---

## 4. Prisma Client Basics (The Magic)

Prisma generates a fully type-safe client based on your schema.

**1. `include` (Fetch related data)**
```ts
const userWithTodos = await prisma.user.findFirst({
  where: { id: "123" },
  include: { todos: true }
});
// userWithTodos.todos is a strongly typed array!
```

**2. `select` (Fetch only specific fields for better performance)**
```ts
const userBrief = await prisma.user.findFirst({
  where: { id: "123" },
  select: { email: true, todos: { select: { title: true } } }
});
// You only get the email and the titles of the todos. Nothing else is downloaded from the DB.
```

**3. Migrations**
Whenever you change `schema.prisma`, you MUST tell the database to update its actual tables to match your new code.
- Run: `npx prisma migrate dev --name describe_your_change`
- This creates a SQL file in `prisma/migrations/` and runs it against your database.
