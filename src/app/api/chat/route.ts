// src/app/api/chat/route.ts
import { AI_TOOLS, ToolResult } from "@/lib/ai-tools";
import { getToolExecutor } from "@/lib/tool-executor-singleton";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Initialize tool executor
        const toolExecutor = await getToolExecutor();


        // Create system message with context about the database
        const systemMessage = {
            role: "system" as const,
            content: `You are a helpful AI assistant for sales representatives and agents. You have access to a retail database with the following information:
      
      - Product records with stock codes, descriptions, prices, quantities
      - Customer information and purchase history
      - Sales data across different countries and time periods
      - Invoice dates and transaction details
      - Invoice information and transaction records
      
     TOOL SELECTION GUIDELINES:
- Use 'semantic_search' for natural language queries, product descriptions, or when users ask for "similar" products, recommendations, or conceptual searches
- Use 'search_products' for specific searches with multiple filters or constraints
- Use specific tools like 'get_customer_purchases', 'get_country_sales' for targeted data retrieval
- Use 'get_product_statistics' for overview/summary information
- Use 'get_top_selling_products' for performance analysis

RESPONSE GUIDELINES:
- Always provide context and insights, not just raw data
- Format numbers appropriately (currency, percentages, etc.)
- Identify trends and patterns in the data
- Make recommendations based on the data when appropriate
- If results are large, summarize key findings first
      
      Use the appropriate tools to provide accurate, data-driven responses. Always be helpful and explain your findings clearly.`
        };

        // Prepare messages for OpenAI
        const conversationMessages = [systemMessage, ...messages];

        // Make initial API call to OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: conversationMessages,
            tools: AI_TOOLS.map(tool => ({
                type: "function" as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }
            })),
            tool_choice: "auto"
        });

        const responseMessage = response.choices[0].message;
        let toolResults: ToolResult[] = [];

        // Handle tool calls if any
        if (responseMessage.tool_calls) {
            toolResults = await Promise.all(
                responseMessage.tool_calls.map(async (toolCall) => {
                    const result = await toolExecutor.executeTool({
                        name: toolCall.function.name,
                        parameters: JSON.parse(toolCall.function.arguments),
                        id: toolCall.id
                    });
                    return result;
                })
            );

            // Add tool results to conversation
            const toolMessages = toolResults.map(result => ({
                role: "tool" as const,
                content: JSON.stringify(result.result),
                tool_call_id: result.toolCallId
            }));

            // Make second API call with tool results
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    ...conversationMessages,
                    responseMessage,
                    ...toolMessages
                ]
            });

            return NextResponse.json({
                message: finalResponse.choices[0].message.content,
                toolResults: toolResults.map(result => result.displayData).filter(Boolean),
                usage: finalResponse.usage
            });
        }

        // No tool calls, return regular response
        return NextResponse.json({
            message: responseMessage.content,
            toolResults: [],
            usage: response.usage
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}