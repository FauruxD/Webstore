-- CreateTable
CREATE TABLE "HeroContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eyebrow" TEXT NOT NULL,
    "headlineLead" TEXT NOT NULL,
    "headlineItalic" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaUrl" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT NOT NULL,
    "secondaryCtaUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "collectionLabel" TEXT NOT NULL,
    "collectionValue" TEXT NOT NULL,
    "formatLabel" TEXT NOT NULL,
    "formatValue" TEXT NOT NULL,
    "licenseLabel" TEXT NOT NULL,
    "licenseValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "HeroContent_isActive_idx" ON "HeroContent"("isActive");
