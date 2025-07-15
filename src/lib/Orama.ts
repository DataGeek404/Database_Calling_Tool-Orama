import { create, insert, search, type AnyOrama } from "@orama/orama";

import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "./db";
import { getEmbeddings } from "./embedding";

export interface RetailSearchParams {
    term?: string;
    country?: string;
    priceRange?: { min?: number; max?: number };
    dateRange?: { start?: string; end?: string };
    stockCode?: string;
    customerId?: string;
    quantityRange?: { min?: number; max?: number };
    description?: string;
    invoice?: string;
}


export class Oramaclient {
    private orama!: AnyOrama
    private accountId: string;
    constructor(accountId: string) {
        this.accountId = accountId
    }
    async saveIndex() {
        const index = await persist(this.orama, 'json')
        await db.account.update({
            where: {
                accountId: this.accountId
            },
            data: {
                OramaIndex: index
            }
        })
    }
    async initialize() {
        const account = await db.account.findUnique({
            where: {
                accountId: this.accountId
            }
        })
        if (!account) {
            throw new Error('Account not found')
        }
        if (account.OramaIndex) {
            this.orama = await restore('json', account.OramaIndex as any)
        } else {
            this.orama = await create({
                schema: {
                    invoice: 'string',
                    stockCode: 'string',
                    description: 'string',
                    quantity: 'number',
                    invoiceDate: 'string',
                    price: 'number',
                    customerId: 'string',
                    country: 'string',
                    embeddings: 'vector[1536]'
                }
            })
            await this.saveIndex()
        }
    }
    async vectorSearch({ term }: { term: string }) {
        const embeddings = await getEmbeddings(term)
        if (!embeddings) {
            throw new Error('Failed to get embeddings')
        }
        const results = await search(this.orama, {
            mode: 'hybrid',
            term: term,
            vector: {
                value: embeddings,
                property: 'embeddings'
            },
            similarity: 0.8,
            limit: 10
        })
        return results
    }
    async search({ term }: { term: string }) {
        return await search(this.orama, { term })
    }
    async insert(document: any) {
        await insert(this.orama, document)
        await this.saveIndex()
    }
    async searchProducts(params: RetailSearchParams) {

        let searchTerm = params.term || '';

        // Build search term from multiple parameters
        if (params.description) {
            searchTerm += ` ${params.description}`;
        }
        if (params.stockCode) {
            searchTerm += ` ${params.stockCode}`;
        }
        if (params.country) {
            searchTerm += ` ${params.country}`;
        }
        if (params.invoice) {
            searchTerm += ` ${params.invoice}`;
        }
        if (params.customerId) {
            searchTerm += ` ${params.customerId}`;
        }

        const results = await search(this.orama, {
            term: searchTerm.trim() || '*',
            limit: 500
        });

        // Apply additional filters
        let filteredHits = results.hits;

        if (params.priceRange) {
            filteredHits = filteredHits.filter((hit: any) => {
                const price = hit.document.price;
                return (!params.priceRange!.min || price >= params.priceRange!.min) &&
                    (!params.priceRange!.max || price <= params.priceRange!.max);
            });
        }

        if (params.quantityRange) {
            filteredHits = filteredHits.filter((hit: any) => {
                const quantity = hit.document.quantity;
                return (!params.quantityRange!.min || quantity >= params.quantityRange!.min) &&
                    (!params.quantityRange!.max || quantity <= params.quantityRange!.max);
            });
        }

        if (params.dateRange) {
            filteredHits = filteredHits.filter((hit: any) => {
                const date = new Date(hit.document.invoiceDate);
                const start = params.dateRange!.start ? new Date(params.dateRange!.start) : null;
                const end = params.dateRange!.end ? new Date(params.dateRange!.end) : null;

                return (!start || date >= start) && (!end || date <= end);
            });
        }

        if (params.country) {
            filteredHits = filteredHits.filter((hit: any) =>
                hit.document.country.toLowerCase().includes(params.country!.toLowerCase())
            );
        }

        if (params.stockCode) {
            filteredHits = filteredHits.filter((hit: any) =>
                hit.document.stockCode.toLowerCase().includes(params.stockCode!.toLowerCase())
            );
        }

        if (params.customerId) {
            filteredHits = filteredHits.filter((hit: any) =>
                hit.document.customerId.toLowerCase().includes(params.customerId!.toLowerCase())
            );
        }

        if (params.invoice) {
            filteredHits = filteredHits.filter((hit: any) =>
                hit.document.invoice.toLowerCase().includes(params.invoice!.toLowerCase())
            );
        }

        return {
            ...results,
            hits: filteredHits,
            count: filteredHits.length
        };
    }

    // Helper methods for backward compatibility
    async getProductsByCountry(country: string) {
        return await this.searchProducts({ country });
    }

    async getProductsByPriceRange(min?: number, max?: number) {
        return await this.searchProducts({ priceRange: { min, max } });
    }

    async getProductsByDateRange(start?: string, end?: string) {
        return await this.searchProducts({ dateRange: { start, end } });
    }

    async getTopSellingProducts(limit: number = 10) {
        const results = await search(this.orama, {
            term: '*',
            limit: 200
        });

        // Group by product and sum quantities
        const productMap = new Map();
        results.hits.forEach((hit: any) => {
            const doc = hit.document;
            const key = `${doc.stockCode}-${doc.description}`;
            if (productMap.has(key)) {
                productMap.get(key).totalQuantity += doc.quantity;
                productMap.get(key).count += 1;
                productMap.get(key).totalRevenue += (doc.price * doc.quantity);
            } else {
                productMap.set(key, {
                    stockCode: doc.stockCode,
                    description: doc.description,
                    totalQuantity: doc.quantity,
                    count: 1,
                    averagePrice: doc.price,
                    totalRevenue: doc.price * doc.quantity,
                    countries: [doc.country]
                });
            }
        });

        return Array.from(productMap.values())
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, limit);
    }

    async getProductsByInvoice(invoice: string) {
        return await this.searchProducts({ invoice });
    }

    async getProductsByCustomer(customerId: string) {
        return await this.searchProducts({ customerId });
    }

    async getProductsByStockCode(stockCode: string) {
        return await this.searchProducts({ stockCode });
    }

    async getRecentSales(days: number = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await this.searchProducts({
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        });
    }

    async getProductStatistics() {

        const allResults = await search(this.orama, {
            term: '*',
            limit: 10000
        });

        const stats = {
            totalProducts: allResults.count,
            uniqueCountries: new Set(),
            uniqueCustomers: new Set(),
            uniqueStockCodes: new Set(),
            totalRevenue: 0,
            totalQuantity: 0,
            priceRange: { min: Infinity, max: -Infinity },
            dateRange: { min: '', max: '' }
        };

        allResults.hits.forEach((hit: any) => {
            const doc = hit.document;
            stats.uniqueCountries.add(doc.country);
            stats.uniqueCustomers.add(doc.customerId);
            stats.uniqueStockCodes.add(doc.stockCode);
            stats.totalRevenue += doc.price * doc.quantity;
            stats.totalQuantity += doc.quantity;
            stats.priceRange.min = Math.min(stats.priceRange.min, doc.price);
            stats.priceRange.max = Math.max(stats.priceRange.max, doc.price);

            if (!stats.dateRange.min || doc.invoiceDate < stats.dateRange.min) {
                stats.dateRange.min = doc.invoiceDate;
            }
            if (!stats.dateRange.max || doc.invoiceDate > stats.dateRange.max) {
                stats.dateRange.max = doc.invoiceDate;
            }
        });

        return {
            ...stats,
            uniqueCountries: Array.from(stats.uniqueCountries),
            uniqueCustomers: Array.from(stats.uniqueCustomers),
            uniqueStockCodes: Array.from(stats.uniqueStockCodes)
        };
    }
}