-- 動画系テーブルをVISTELQの管理下に統合する移行。
-- すでに動画販売サイト(Projects)がNeonに作成済みのテーブルがある環境でも、
-- 何も壊さず安全に適用できるよう、すべて「無ければ作る」形にしています。

-- CreateTable
CREATE TABLE IF NOT EXISTS "Work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actressSlug" TEXT NOT NULL,
    "actressName" TEXT NOT NULL,
    "genreSlug" TEXT NOT NULL,
    "genreName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "affiliateUrl" TEXT,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'demo',
    "fetchedAt" TIMESTAMP(3),

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Actress" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Actress_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Genre" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkActress" (
    "workId" TEXT NOT NULL,
    "actressSlug" TEXT NOT NULL,

    CONSTRAINT "WorkActress_pkey" PRIMARY KEY ("workId","actressSlug")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkGenre" (
    "workId" TEXT NOT NULL,
    "genreSlug" TEXT NOT NULL,

    CONSTRAINT "WorkGenre_pkey" PRIMARY KEY ("workId","genreSlug")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Asp" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Asp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "aspId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "price" INTEGER,
    "affiliateUrl" TEXT,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AffiliateClick" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "aspId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_actressSlug_idx" ON "Work"("actressSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_genreSlug_idx" ON "Work"("genreSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_reviewCount_idx" ON "Work"("reviewCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkActress_actressSlug_idx" ON "WorkActress"("actressSlug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkGenre_genreSlug_idx" ON "WorkGenre"("genreSlug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Asp_code_key" ON "Asp"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Offer_workId_idx" ON "Offer"("workId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Offer_aspId_externalId_key" ON "Offer"("aspId", "externalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_workId_createdAt_idx" ON "AffiliateClick"("workId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AffiliateClick_aspId_createdAt_idx" ON "AffiliateClick"("aspId", "createdAt");

-- AddForeignKey（既にある場合は何もしない）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkActress_workId_fkey') THEN
    ALTER TABLE "WorkActress" ADD CONSTRAINT "WorkActress_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkActress_actressSlug_fkey') THEN
    ALTER TABLE "WorkActress" ADD CONSTRAINT "WorkActress_actressSlug_fkey" FOREIGN KEY ("actressSlug") REFERENCES "Actress"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkGenre_workId_fkey') THEN
    ALTER TABLE "WorkGenre" ADD CONSTRAINT "WorkGenre_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkGenre_genreSlug_fkey') THEN
    ALTER TABLE "WorkGenre" ADD CONSTRAINT "WorkGenre_genreSlug_fkey" FOREIGN KEY ("genreSlug") REFERENCES "Genre"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_workId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Offer_aspId_fkey') THEN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_aspId_fkey" FOREIGN KEY ("aspId") REFERENCES "Asp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
