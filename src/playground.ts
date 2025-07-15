import { create, insert, search } from '@orama/orama'
import { db } from './lib/db'



const orama = await create({
    schema: {
        invoice: 'string',
        stockCode: 'string',
        description: 'string',
        quantity: 'number',
        invoiceDate: 'string',
        price: 'number',
        customerId: 'string',
        country: 'string',
        // embeddings: 'vector[1536]'
    }
})

const records = await db.retailRecord.findMany({
    select: {
        invoiceDate: true,
        stockCode: true,
        description: true,
        quantity: true,
        price: true,
        customerId: true,
        country: true,
        invoice: true,
    }
})

for (const record of records.slice(0, 100)) {
    // console.log(email.subject)
    await insert(orama, {
        invoice: record.invoice,
        stockCode: record.stockCode,
        description: record.description,
        quantity: record.quantity,
        invoiceDate: record.invoiceDate.toISOString(),
        price: record.price,
        customerId: record.customerId,
        country: record.country
    })
}

const searchResult = await search(orama, {
    term: "3",
})

console.log(searchResult.hits.map(hit => ({
    invoice: hit.document.invoice,
    stockCode: hit.document.stockCode,
    description: hit.document.description,
    quantity: hit.document.quantity,
    invoiceDate: hit.document.invoiceDate,
    price: hit.document.price,
    customerId: hit.document.customerId,
    country: hit.document.country,
    search: hit.score
})))