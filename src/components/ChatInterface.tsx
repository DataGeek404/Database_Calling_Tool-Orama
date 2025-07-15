"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolDisplayData, useChat } from '@/hooks/useChat';
import { Bot, Database, DollarSign, MoreVertical, Send, Trash2, TrendingUp, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Tool Results Display Component
const ToolResultsDisplay: React.FC<{ toolResults: ToolDisplayData[] }> = ({ toolResults }) => {
    if (!toolResults || toolResults.length === 0) return null;

    return (
        <div className="mt-3 space-y-3">
            {toolResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3 bg-slate-50">
                    {result.title && (
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-blue-600" />
                            <h4 className="font-medium text-sm text-slate-700">{result.title}</h4>
                        </div>
                    )}

                    {result.type === 'list' && (
                        <ul className="space-y-1">
                            {result.data.map((item: any, itemIndex: number) => (
                                <li key={itemIndex} className="text-sm text-slate-700 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                    {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                </li>
                            ))}
                        </ul>
                    )}

                    {result.type === 'text' && (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.data}</p>
                    )}

                    {result.type === 'chart' && (
                        <div className="bg-white p-3 rounded border">
                            <div className="text-sm text-slate-500 text-center">
                                Chart visualization would go here
                            </div>
                        </div>
                    )}

                    {result.type === 'table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b">
                                        {result.data.length > 0 && Object.keys(result.data[0]).map((key) => (
                                            <th key={key} className="text-left p-2 font-medium text-slate-600 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.data.slice(0, 5).map((row: any, rowIndex: number) => (
                                        <tr key={rowIndex} className="border-b hover:bg-slate-100">
                                            {Object.entries(row).map(([key, value], cellIndex) => (
                                                <td key={cellIndex} className="p-2 text-slate-700">
                                                    {typeof value === 'number' ?
                                                        (key.includes('price') || key.includes('Price') ?
                                                            `$${value.toFixed(2)}` :
                                                            value.toLocaleString()
                                                        ) :
                                                        String(value)
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {result.data.length > 5 && (
                                <div className="text-xs text-slate-500 mt-2 text-center">
                                    Showing 5 of {result.data.length} results
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const ChatInterface = () => {
    const { messages, isTyping, sendMessage, clearMessages } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;
        const messageContent = inputValue;
        setInputValue('');
        await sendMessage(messageContent);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) => {
        // Ensure date is a Date object
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Quick action buttons
    const quickActions = [
        { label: "Top selling products", query: "Show me the top 10 selling products" },
        { label: "Products by country", query: "Show me products grouped by country" },
        { label: "Price analysis", query: "Show me products in different price ranges" },
        { label: "Recent sales", query: "Show me sales from the last month" }
    ];

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto bg-background overflow-y-auto">
            {/* Header */}
            <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Database className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg">AI Database Assistant</h1>
                            <p className="text-sm text-muted-foreground">
                                {isTyping ? (
                                    <span className="flex items-center gap-1">
                                        <span className="animate-pulse">Searching database...</span>
                                        <Bot className="w-3 h-3 animate-spin" />
                                    </span>
                                ) : (
                                    'Ask me anything about our retail database'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {Math.max(0, messages.length - 1)} queries
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={clearMessages}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Clear Chat
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
                <div className="p-4 border-b bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setInputValue(action.query);
                                    setTimeout(() => handleSendMessage(), 100);
                                }}
                                className="text-xs"
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 animate-fade-in ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            {message.sender === 'bot' && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${message.isError ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                    }`}>
                                    <Database className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : ''}`}>
                                <Card className={`p-3 transition-all duration-200 hover:shadow-md ${message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground ml-auto'
                                    : message.isError
                                        ? 'bg-red-50 border-red-200 hover:bg-red-50/80'
                                        : 'bg-muted hover:bg-muted/80'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                                    {/* Tool Results Display */}
                                    {message.toolResults && message.toolResults.length > 0 && (
                                        <ToolResultsDisplay toolResults={message.toolResults} />
                                    )}
                                </Card>
                                <p className={`text-xs text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'
                                    }`}>
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>

                            {message.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1 order-3">
                                    <User className="w-4 h-4 text-secondary-foreground" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-3 justify-start animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <Database className="w-4 h-4 text-white" />
                            </div>
                            <Card className="p-3 bg-muted">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Analyzing database...</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-card p-4">
                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about products, sales, customers, or any database query..."
                        className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        disabled={isTyping}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        size="icon"
                        className="shrink-0 transition-all duration-200 hover:scale-105"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Sales Analytics</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Price Insights</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>Product Search</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;