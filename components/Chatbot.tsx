import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse, startChat } from '../services/geminiService';
import { ChatIcon } from './icons';
import { AppContext } from '../App';

const Chatbot: React.FC = () => {
    const { medicines, reminders } = useContext(AppContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startChat(medicines, reminders);
        setMessages([{
            sender: 'ai',
            text: "Hello! I'm your Pill Papa AI assistant. I can see your dashboard and weekly view. Ask me anything about your medications or schedule. Please remember to consult a healthcare professional for medical advice."
        }]);
    }, [medicines, reminders]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getChatResponse(input);
            const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                                <ChatIcon className="w-6 h-6" />
                            </div>
                        )}
                        <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${msg.sender === 'user'
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
                            <ChatIcon className="w-6 h-6" />
                        </div>
                        <div className="max-w-md px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                            <div className="flex items-center space-x-1">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your medicine..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || input.trim() === ''}
                    className="bg-orange-500 text-white font-bold p-3 rounded-full hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-500/30 disabled:cursor-not-allowed transition-colors duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Chatbot;