//src/anotherplayground.ts

import { Oramaclient } from "./lib/Orama";

const orama = new Oramaclient('main-retail-index');

async function run() {
    await orama.initialize();

    // Example usage of Oramaclient methods
    const searchResults = await orama.search({ term: 'pizza' });
    console.log('Search Results:', searchResults.hits.map(hit => ({
        invoice: hit.document.invoice,
        searchScore: hit.score,
        // stockCode: hit.document.stockCode,
        description: hit.document.description,
        quantity: hit.document.quantity,
        // invoiceDate: hit.document.invoiceDate,
        price: hit.document.price,
    })).slice(0, 10));

    const productsByCountry = await orama.getProductsByCountry('United Kingdom');
    console.log('Products by Country:', productsByCountry.hits.slice(0, 10));

    const topSellingProducts = await orama.getTopSellingProducts(5);
    console.log('Top Selling Products:', topSellingProducts);
}



run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
