-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "salePrice" INTEGER,
    "license" TEXT NOT NULL DEFAULT 'Personal License',
    "downloadPolicy" TEXT NOT NULL DEFAULT '7_DAYS_5_DOWNLOADS',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "heroOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "createdAt", "description", "downloadPolicy", "id", "isFeatured", "license", "name", "price", "salePrice", "slug", "status", "updatedAt") SELECT "categoryId", "createdAt", "description", "downloadPolicy", "id", "isFeatured", "license", "name", "price", "salePrice", "slug", "status", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_isFeatured_heroOrder_idx" ON "Product"("status", "isFeatured", "heroOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
