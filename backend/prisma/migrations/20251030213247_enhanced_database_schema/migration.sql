/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `failedLoginAttempts` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isTwoFactorEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lockoutUntil` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetTokenExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorSecret` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenExpires` on the `User` table. All the data in the column will be lost.
  - Added the required column `password_hash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Subscription";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Subscription_Groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "total_price" REAL NOT NULL,
    "slots_total" INTEGER NOT NULL,
    "slots_filled" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "proof_document" TEXT,
    "admin_approved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Subscription_Groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group_Memberships" (
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "join_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATETIME,
    "share_amount" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("user_id", "group_id"),
    CONSTRAINT "Group_Memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Group_Memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Subscription_Groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "payment_gateway_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Withdrawal_Requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "upi_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME,
    "cooldown_expires_at" DATETIME,
    CONSTRAINT "Withdrawal_Requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Encrypted_Credentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group_id" INTEGER NOT NULL,
    "encrypted_username" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "encryption_key_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Encrypted_Credentials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Subscription_Groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audit_Logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "old_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Audit_Logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Email_Verifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    CONSTRAINT "Email_Verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Password_Reset_Tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    CONSTRAINT "Password_Reset_Tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Active_Sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "Active_Sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "credit_balance" REAL NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
);
INSERT INTO "new_User" ("email", "id", "name") SELECT "email", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Subscription_Groups_owner_id_idx" ON "Subscription_Groups"("owner_id");

-- CreateIndex
CREATE INDEX "Group_Memberships_user_id_idx" ON "Group_Memberships"("user_id");

-- CreateIndex
CREATE INDEX "Group_Memberships_group_id_idx" ON "Group_Memberships"("group_id");

-- CreateIndex
CREATE INDEX "Transactions_user_id_idx" ON "Transactions"("user_id");

-- CreateIndex
CREATE INDEX "Withdrawal_Requests_user_id_idx" ON "Withdrawal_Requests"("user_id");

-- CreateIndex
CREATE INDEX "Encrypted_Credentials_group_id_idx" ON "Encrypted_Credentials"("group_id");

-- CreateIndex
CREATE INDEX "Reviews_user_id_idx" ON "Reviews"("user_id");

-- CreateIndex
CREATE INDEX "Reviews_group_id_idx" ON "Reviews"("group_id");

-- CreateIndex
CREATE INDEX "Audit_Logs_user_id_idx" ON "Audit_Logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Email_Verifications_token_key" ON "Email_Verifications"("token");

-- CreateIndex
CREATE INDEX "Email_Verifications_user_id_idx" ON "Email_Verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Password_Reset_Tokens_token_key" ON "Password_Reset_Tokens"("token");

-- CreateIndex
CREATE INDEX "Password_Reset_Tokens_user_id_idx" ON "Password_Reset_Tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Active_Sessions_session_token_key" ON "Active_Sessions"("session_token");

-- CreateIndex
CREATE INDEX "Active_Sessions_user_id_idx" ON "Active_Sessions"("user_id");
