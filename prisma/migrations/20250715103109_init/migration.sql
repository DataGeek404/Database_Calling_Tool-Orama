-- CreateTable
CREATE TABLE "RetailRecord" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "invoice" TEXT NOT NULL,
    "stockCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "customerId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "OramaIndex" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RetailRecord_stockCode_idx" ON "RetailRecord"("stockCode");

-- CreateIndex
CREATE INDEX "RetailRecord_country_idx" ON "RetailRecord"("country");

-- CreateIndex
CREATE INDEX "RetailRecord_customerId_idx" ON "RetailRecord"("customerId");

-- CreateIndex
CREATE INDEX "RetailRecord_invoice_idx" ON "RetailRecord"("invoice");

-- CreateIndex
CREATE INDEX "RetailRecord_invoiceDate_idx" ON "RetailRecord"("invoiceDate");

-- CreateIndex
CREATE INDEX "RetailRecord_price_idx" ON "RetailRecord"("price");

-- CreateIndex
CREATE INDEX "RetailRecord_stockCode_country_idx" ON "RetailRecord"("stockCode", "country");

-- CreateIndex
CREATE INDEX "RetailRecord_invoiceDate_country_idx" ON "RetailRecord"("invoiceDate", "country");

-- CreateIndex
CREATE INDEX "RetailRecord_customerId_invoiceDate_idx" ON "RetailRecord"("customerId", "invoiceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountId_key" ON "Account"("accountId");

-- AddForeignKey
ALTER TABLE "RetailRecord" ADD CONSTRAINT "RetailRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Account"("accountId") ON DELETE RESTRICT ON UPDATE CASCADE;
