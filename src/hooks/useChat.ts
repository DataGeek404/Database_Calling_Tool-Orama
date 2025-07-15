// src/hooks/useChat.ts
import { useCallback, useState } from 'react';

export interface ToolDisplayData {
    type: 'table' | 'chart' | 'text' | 'list';
    data: any;
    title?: string;
}

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    toolResults?: ToolDisplayData[];
    isError?: boolean;
}

interface UseChatReturn {
    messages: Message[];
    isTyping: boolean;
    sendMessage: (content: string) => Promise<void>;
    clearMessages: () => void;
}

export const useChat = (): UseChatReturn => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'Hello! I\'m your AI Database Assistant. I can help you search through our retail database to find information about products, sales, customers, and more. What would you like to know?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    })),
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.message || 'I encountered an error processing your request.',
                sender: 'bot',
                timestamp: new Date(),
                toolResults: data.toolResults || [],
                isError: !data.message
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, [messages]);

    const clearMessages = useCallback(() => {
        setMessages([{
            id: '1',
            content: 'Hello! I\'m your AI Database Assistant. I can help you search through our retail database to find information about products, sales, customers, and more. What would you like to know?',
            sender: 'bot',
            timestamp: new Date()
        }]);
    }, []);

    return {
        messages,
        isTyping,
        sendMessage,
        clearMessages
    };
};