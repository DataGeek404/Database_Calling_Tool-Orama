// src/lib/ai-tools.ts
import { Oramaclient, RetailSearchParams } from './Orama';

export interface ToolCall {
    name: string;
    parameters: any;
    id: string;
}

export interface ToolResult {
    toolCallId: string;
    result: any;
    displayData?: {
        type: 'table' | 'chart' | 'text' | 'list';
        data: any;
        title?: string;
    };
}

export const AI_TOOLS = [
    {
        name: 'search_products',
        description: 'Search for products in the retail database with various filters',
        parameters: {
            type: 'object',
            properties: {
                term: {
                    type: 'string',
                    description: 'Search term for product description or general search'
                },
                country: {
                    type: 'string',
                    description: 'Filter by country'
                },
                priceMin: {
                    type: 'number',
                    description: 'Minimum price filter'
                },
                priceMax: {
                    type: 'number',
                    description: 'Maximum price filter'
                },
                dateStart: {
                    type: 'string',
                    description: 'Start date for filtering (YYYY-MM-DD format)'
                },
                dateEnd: {
                    type: 'string',
                    description: 'End date for filtering (YYYY-MM-DD format)'
                },
                stockCode: {
                    type: 'string',
                    description: 'Specific stock code to search for'
                },
                customerId: {
                    type: 'string',
                    description: 'Filter by customer ID'
                },
                quantityMin: {
                    type: 'number',
                    description: 'Minimum quantity filter'
                },
                quantityMax: {
                    type: 'number',
                    description: 'Maximum quantity filter'
                }
            }
        }
    },
    {
        name: 'get_products_by_country',
        description: 'Get all products from a specific country',
        parameters: {
            type: 'object',
            properties: {
                country: {
                    type: 'string',
                    description: 'Country name to filter by'
                }
            },
            required: ['country']
        }
    },
    {
        name: 'get_price_range_products',
        description: 'Get products within a specific price range',
        parameters: {
            type: 'object',
            properties: {
                minPrice: {
                    type: 'number',
                    description: 'Minimum price'
                },
                maxPrice: {
                    type: 'number',
                    description: 'Maximum price'
                }
            }
        }
    },
    {
        name: 'get_top_selling_products',
        description: 'Get the top selling products by quantity',
        parameters: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Number of top products to return (default: 10)'
                }
            }
        }
    },
    {
        name: 'get_products_by_date_range',
        description: 'Get products sold within a specific date range',
        parameters: {
            type: 'object',
            properties: {
                startDate: {
                    type: 'string',
                    description: 'Start date (YYYY-MM-DD format)'
                },
                endDate: {
                    type: 'string',
                    description: 'End date (YYYY-MM-DD format)'
                }
            }
        }
    },
    {
        name: 'vector_search',
        description: 'Perform semantic search using embeddings for more contextual results',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Natural language query for semantic search'
                }
            },
            required: ['query']
        }
    }
];

export class ToolExecutor {
    private oramaClient: Oramaclient;
    private isInitialized: boolean = false;

    constructor() {
        // Initialize the Orama client instance
        this.oramaClient = new Oramaclient('main-retail-index');
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('Orama client already initialized');
            return;
        }

        try {
            await this.oramaClient.initialize();
            this.isInitialized = true;
            console.log('Orama client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Orama client:', error);
            throw error;
        }
    }

    // Ensure initialization before executing tools
    private async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    async executeTool(toolCall: ToolCall): Promise<ToolResult> {
        const { name, parameters, id } = toolCall;

        try {
            // Make sure Orama client is initialized
            await this.ensureInitialized();

            switch (name) {
                case 'search_products':
                    return await this.searchProducts(id, parameters);

                case 'get_products_by_country':
                    return await this.getProductsByCountry(id, parameters);

                case 'get_price_range_products':
                    return await this.getPriceRangeProducts(id, parameters);

                case 'get_top_selling_products':
                    return await this.getTopSellingProducts(id, parameters);

                case 'get_products_by_date_range':
                    return await this.getProductsByDateRange(id, parameters);

                case 'vector_search':
                    return await this.vectorSearch(id, parameters);

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error: any) {
            console.error(`Error executing tool ${name}:`, error);
            return {
                toolCallId: id,
                result: { error: `Error executing ${name}: ${error.message}` },
                displayData: {
                    type: 'text',
                    data: `Error: ${error.message}`,
                    title: 'Tool Execution Error'
                }
            };
        }
    }

    private async searchProducts(toolCallId: string, params: any): Promise<ToolResult> {
        const searchParams: RetailSearchParams = {
            term: params.term,
            country: params.country,
            stockCode: params.stockCode,
            customerId: params.customerId,
            priceRange: (params.priceMin || params.priceMax) ? {
                min: params.priceMin,
                max: params.priceMax
            } : undefined,
            dateRange: (params.dateStart || params.dateEnd) ? {
                start: params.dateStart,
                end: params.dateEnd
            } : undefined,
            quantityRange: (params.quantityMin || params.quantityMax) ? {
                min: params.quantityMin,
                max: params.quantityMax
            } : undefined
        };

        const results = await this.oramaClient.searchProducts(searchParams);
        console.log(`Search results for "${params.term}":`, results);

        const products = results.hits.map((hit: any) => ({
            stockCode: hit.document.stockCode,
            description: hit.document.description,
            price: hit.document.price,
            quantity: hit.document.quantity,
            country: hit.document.country,
            invoiceDate: hit.document.invoiceDate,
            customerId: hit.document.customerId,
            score: hit.score
        }));

        return {
            toolCallId,
            result: {
                count: results.count,
                products: products,
                elapsed: results.elapsed
            },
            displayData: {
                type: 'table',
                data: products,
                title: `Search Results (${results.count} found)`
            }
        };
    }

    private async getProductsByCountry(toolCallId: string, params: any): Promise<ToolResult> {
        const results = await this.oramaClient.getProductsByCountry(params.country);

        const products = results.hits.map((hit: any) => ({
            stockCode: hit.document.stockCode,
            description: hit.document.description,
            price: hit.document.price,
            quantity: hit.document.quantity,
            invoiceDate: hit.document.invoiceDate,
            customerId: hit.document.customerId
        }));

        return {
            toolCallId,
            result: { country: params.country, products },
            displayData: {
                type: 'table',
                data: products,
                title: `Products from ${params.country} (${products.length} found)`
            }
        };
    }

    private async getPriceRangeProducts(toolCallId: string, params: any): Promise<ToolResult> {
        const results = await this.oramaClient.getProductsByPriceRange(params.minPrice, params.maxPrice);

        const products = results.hits.map((hit: any) => ({
            stockCode: hit.document.stockCode,
            description: hit.document.description,
            price: hit.document.price,
            quantity: hit.document.quantity,
            country: hit.document.country,
            invoiceDate: hit.document.invoiceDate
        }));

        return {
            toolCallId,
            result: { priceRange: { min: params.minPrice, max: params.maxPrice }, products },
            displayData: {
                type: 'table',
                data: products,
                title: `Products in Price Range $${params.minPrice || 0} - $${params.maxPrice || '∞'}`
            }
        };
    }

    private async getTopSellingProducts(toolCallId: string, params: any): Promise<ToolResult> {
        const limit = params.limit || 10;
        const results = await this.oramaClient.getTopSellingProducts(limit);

        return {
            toolCallId,
            result: { topProducts: results },
            displayData: {
                type: 'table',
                data: results,
                title: `Top ${limit} Selling Products`
            }
        };
    }

    private async getProductsByDateRange(toolCallId: string, params: any): Promise<ToolResult> {
        const results = await this.oramaClient.getProductsByDateRange(params.startDate, params.endDate);

        const products = results.hits.map((hit: any) => ({
            stockCode: hit.document.stockCode,
            description: hit.document.description,
            price: hit.document.price,
            quantity: hit.document.quantity,
            country: hit.document.country,
            invoiceDate: hit.document.invoiceDate,
            customerId: hit.document.customerId
        }));

        return {
            toolCallId,
            result: { dateRange: { start: params.startDate, end: params.endDate }, products },
            displayData: {
                type: 'table',
                data: products,
                title: `Products from ${params.startDate} to ${params.endDate}`
            }
        };
    }

    private async vectorSearch(toolCallId: string, params: any): Promise<ToolResult> {
        const results = await this.oramaClient.vectorSearch({ term: params.query });

        const products = results.hits.map((hit: any) => ({
            stockCode: hit.document.stockCode,
            description: hit.document.description,
            price: hit.document.price,
            quantity: hit.document.quantity,
            country: hit.document.country,
            invoiceDate: hit.document.invoiceDate,
            relevanceScore: hit.score
        }));

        return {
            toolCallId,
            result: { query: params.query, products },
            displayData: {
                type: 'table',
                data: products,
                title: `Semantic Search Results for "${params.query}"`
            }
        };
    }

    async destroy() {
        this.isInitialized = false;
    }
}