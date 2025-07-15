import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbeddings(text: string): Promise<number[] | null> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embeddings:', error);
        return null;
    }
}

export async function getBatchEmbeddings(texts: string[]): Promise<number[][] | null> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: texts,
            encoding_format: 'float',
        });

        return response.data.map(item => item.embedding);
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        return null;
    }
}