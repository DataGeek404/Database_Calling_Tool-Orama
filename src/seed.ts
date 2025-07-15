
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from "../generated/client";
import { Oramaclient } from './lib/Orama';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // First, clean up existing data (optional)
    await prisma.retailRecord.deleteMany({});
    await prisma.account.deleteMany({});

    await prisma.account.upsert({
        where: { accountId: 'main-retail-index' },
        update: {},
        create: {
            accountId: 'main-retail-index',
        },
    });

    const csvPath = path.join(__dirname, 'online_retail_II.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });

    // Limit to 200 rows
    const limitedRecords = records.slice(0, 200) as any[];
    const orama = new Oramaclient('main-retail-index');
    await orama.initialize()

    for (const row of limitedRecords) {
        await prisma.retailRecord.create({
            data: {
                invoice: row.Invoice,
                userId: 'main-retail-index',
                stockCode: row.StockCode,
                description: row.Description,
                quantity: Number(row.Quantity),
                invoiceDate: new Date(row.InvoiceDate),
                price: Number(row.Price),
                customerId: row['Customer ID'],
                country: row.Country,
            }
        });
        console.log('orama insertation');
        await orama.insert({
            invoice: row.Invoice,
            stockCode: row.StockCode,
            description: row.Description,
            quantity: Number(row.Quantity),
            invoiceDate: new Date(row.InvoiceDate).toISOString(),
            price: Number(row.Price),
            customerId: row['Customer ID'],
            country: row.Country,
        });
        console.log("Orama Index saved");

    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });



