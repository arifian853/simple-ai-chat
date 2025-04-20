/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction, useEffect, useRef, useState, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { MdRefresh, MdSend } from "react-icons/md";
import { FaAngleDown, FaRegStar, FaTrash } from "react-icons/fa6";
import Markdown from 'react-markdown'

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Pastikan untuk mengimpor stylesheet KaTeX
import 'katex/dist/katex.min.css';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from './components/ui/dialog';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"
import { FaInfoCircle } from "react-icons/fa";
import { HiOutlineDotsVertical } from "react-icons/hi";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SiGooglegemini } from 'react-icons/si';
import { ModeToggle } from './components/mode-toggle';
import { FaCopy } from "react-icons/fa";

interface MessageLimitState {
    messageCount: number;
    lastResetTimestamp: number;
}

interface Message {
    sender: string;
    text: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined;
    isThinking?: boolean;
    isLoading?: boolean;
}

export const Chat = () => {

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };
    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem("chatMessages");
        return savedMessages ? JSON.parse(savedMessages) : [{ sender: 'bot', text: 'Halo! Ada yang mau kamu tanyakan?' }];
    });

    const [messageLimit, setMessageLimit] = useState<MessageLimitState>(() => {
        const savedLimit = localStorage.getItem("messageLimitState");
        return savedLimit
            ? JSON.parse(savedLimit)
            : { messageCount: 0, lastResetTimestamp: Date.now() };
    });

    useEffect(() => {
        localStorage.setItem("messageLimitState", JSON.stringify(messageLimit));
    }, [messageLimit]);

    useEffect(() => {
        const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
        const currentTime = Date.now();

        if (currentTime - messageLimit.lastResetTimestamp >= FOUR_HOURS_IN_MS) {
            // Reset message count after 4 hours
            setMessageLimit({
                messageCount: 0,
                lastResetTimestamp: currentTime
            });
        }
    }, [messageLimit]);

    useEffect(() => {
        localStorage.setItem("chatMessages", JSON.stringify(messages));
    }, [messages]);

    const [input, setInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const [responseTime, setResponseTime] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    // Add state to track if model is loading (before response starts)
    const [isModelLoading, setIsModelLoading] = useState(false);
    // Add state to track if generation should be stopped
    const [shouldStopGeneration, setShouldStopGeneration] = useState(false);

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

    const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash-002");

    const availableModels = [
        { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
        { name: "Gemini 1.5 Flash 8B", value: "gemini-1.5-flash-8b" },
        { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
        { name: "Gemini 2.0 Flash Lite", value: "gemini-2.0-flash-lite" },
        { name: "Gemini 2.0 Flash Thinking", value: "gemini-2.0-flash-thinking-exp-01-21" },
    ];

    const handleModelChange = (modelValue: string) => {
        setSelectedModel(modelValue);
    };

    const handleSend = async () => {
        if (messageLimit.messageCount >= 10) {
            const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
            const remainingCooldown =
                FOUR_HOURS_IN_MS - (Date.now() - messageLimit.lastResetTimestamp);

            const hours = Math.floor(remainingCooldown / (60 * 60 * 1000));
            const minutes = Math.floor((remainingCooldown % (60 * 60 * 1000)) / (60 * 1000));

            setErrorMessage(`Anda telah mencapai batas 10 pesan. Silakan tunggu ${hours} jam ${minutes} menit sebelum mengirim pesan lagi.`);
            return;
        }
        setErrorMessage('');

        if (input.trim() === '') return;
        setMessages([...messages, { sender: 'user', text: input }]);
        setInput('');

        // Store the input for later use in case of error
        const userInput = input;
        const startTime = Date.now(); // Start timing the model response
        
        // Reset stop generation flag
        setShouldStopGeneration(false);

        // Show thinking UI for the thinking model, or loading UI for other models
        if (selectedModel === "gemini-2.0-flash-thinking-exp-01-21") {
            // Add a temporary thinking message
            setMessages((prev: Message[]) => [...prev, { sender: 'bot', text: '🤔 Thinking...', isThinking: true }]);
        } else {
            // For other models, show a loading indicator
            setIsModelLoading(true);
            setMessages((prev: Message[]) => [...prev, { sender: 'bot', text: '⏳ Loading...', isLoading: true }]);
        }

        try {
            // For the thinking model, use a more standard model to avoid API issues
            const modelToUse = selectedModel === "gemini-2.0-flash-thinking-exp-01-21" 
                ? "gemini-1.5-flash" // Fallback to a stable model
                : selectedModel;
                
            const model = genAI.getGenerativeModel({ model: modelToUse });
            const result = await model.generateContent(userInput);
            const response = await result.response;
            const botResponse = await response.text();

            // Calculate the model response time
            const endTime = Date.now();
            setResponseTime(endTime - startTime);

            // Remove thinking/loading message if it exists
            if (selectedModel === "gemini-2.0-flash-thinking-exp-01-21") {
                setMessages((prev: Message[]) => prev.filter(msg => !('isThinking' in msg)));
            } else {
                setIsModelLoading(false);
                setMessages((prev: Message[]) => prev.filter(msg => !('isLoading' in msg)));
            }

            // Check if generation should be stopped
            if (shouldStopGeneration) {
                return;
            }

            simulateBotResponse(botResponse);

            setMessageLimit(prev => ({
                messageCount: prev.messageCount + 1,
                lastResetTimestamp: prev.lastResetTimestamp
            }));

        } catch (error) {
            console.error("Service is unreachable.", error);

            // Remove thinking/loading message if it exists
            if (selectedModel === "gemini-2.0-flash-thinking-exp-01-21") {
                setMessages((prev: Message[]) => prev.filter(msg => !('isThinking' in msg)));
            } else {
                setIsModelLoading(false);
                setMessages((prev: Message[]) => prev.filter(msg => !('isLoading' in msg)));
            }
            
            // For thinking model, provide a more specific error message
            if (selectedModel === "gemini-2.0-flash-thinking-exp-01-21") {
                simulateBotResponse("The thinking model is experimental and currently unavailable. I've processed your request using a standard model instead.");
                
                // Try again with a standard model
                try {
                    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const fallbackResult = await fallbackModel.generateContent(userInput);
                    const fallbackResponse = await fallbackResult.response;
                    const fallbackBotResponse = await fallbackResponse.text();
                    
                    simulateBotResponse(fallbackBotResponse);
                    
                    setMessageLimit(prev => ({
                        messageCount: prev.messageCount + 1,
                        lastResetTimestamp: prev.lastResetTimestamp
                    }));
                    
                    return;
                } catch (fallbackError) {
                    console.error("Fallback service is also unreachable.", fallbackError);
                }
            }
            
            simulateBotResponse("Service is unreachable. Please try again later or select a different model.");
        }
    };

    const simulateBotResponse = (responseText: string) => {
        setIsResponding(true);
        setMessages((prev: Message[]) => [...prev, { sender: 'bot', text: '' }]);

        let index = 0;
        const charsPerIteration = 5;
        const intervalId = setInterval(() => {
            // Check if generation should be stopped
            if (shouldStopGeneration) {
                clearInterval(intervalId);
                setIsResponding(false);
                setShouldStopGeneration(false);
                
                // Important: Update the message to indicate it was stopped
                setMessages((prevMessages: Message[]) => {
                    const updatedMessages = [...prevMessages];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    // Add a note that generation was stopped
                    if (lastMessage && lastMessage.sender === 'bot') {
                        updatedMessages[updatedMessages.length - 1] = {
                            ...lastMessage,
                            text: lastMessage.text + " [Generation stopped]"
                        };
                    }
                    return updatedMessages;
                });
                
                return;
            }

            if (index < responseText.length) {
                setMessages((prevMessages: Message[]) => {
                    const updatedMessages = [...prevMessages];
                    const newIndex = Math.min(index + charsPerIteration, responseText.length);
                    updatedMessages[updatedMessages.length - 1] = {
                        ...updatedMessages[updatedMessages.length - 1],
                        text: responseText.slice(0, newIndex)
                    };
                    return updatedMessages;
                });

                index += charsPerIteration;
            } else {
                clearInterval(intervalId);
                setIsResponding(false);
            }
        }, 10);
    };

    // Improve the stop generation function to be more effective
    const handleStopGeneration = () => {
        console.log("Stopping generation...");
        setShouldStopGeneration(true);
        
        // Force UI update to respond immediately
        setIsResponding(false);
        
        // Clear any pending messages that are still loading
        setMessages((prev: Message[]) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === 'bot' && lastMessage.text === '') {
                // Remove empty bot message if it exists
                return prev.slice(0, -1);
            }
            return prev;
        });
    };

    const handleKeyDown = (e: { key: string; preventDefault: () => void; }) => {
        if (e.key === 'Enter' && !isResponding) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestedText: SetStateAction<string>) => {
        setInput(suggestedText);
    };

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const [suggestionsKey, setSuggestionsKey] = useState(0);

    const renderedSuggestions = useMemo(() => {
        const suggestedMessage = [
            { "message": "Apa yang bisa kamu bantu hari ini?" },
            { "message": "Bagaimana cuaca saat ini di ..." },
            { "message": "Apa kemampuan utamamu?" },
            { "message": "Berikan contoh apa yang bisa kamu lakukan" },
            { "message": "Bantu saya membuat ringkasan soal ..." },
            { "message": "Apa pendapatmu tentang AI?" },
            { "message": "Bisakah kamu membantu saya menulis?" },
            { "message": "Terjemahkan teks ini ..." },
            { "message": "Bantu saya memecahkan masalah ..." },
            { "message": "Berikan tips produktivitas!" },
            { "message": "Jelaskan dengan sederhana soal ..." },
            { "message": "Apa ide kreatif untuk proyek?" },
            { "message": "Bantu saya belajar soal ..." }
        ];

        return suggestedMessage.sort(() => 0.5 - Math.random()).slice(0, 3);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suggestionsKey]);

    const handleNewSuggestions = () => {
        setSuggestionsKey(prevKey => prevKey + 1);
    };

    const handleClearChat = () => {
        const initialMessage = [{ sender: 'bot', text: 'Halo! Ada yang mau kamu tanyakan?' }];
        setMessages(initialMessage);
        localStorage.setItem("chatMessages", JSON.stringify(initialMessage));
        window.location.reload();
    };

    return (
        <>
            <div className="bg-[#E0E0E0] dark:bg-[#1C1D24] min-h-screen flex justify-center items-center p-5">
                <div className="w-full flex items-center md:justify-center justify-start flex-col">
                    <div className='bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-full px-4 py-2 mb-5 transition-all hover:shadow-xl'>
                        <ModeToggle />
                    </div>
                    <Card data-aos="fade-out" data-aos-duration='900' className="md:w-2/3 w-full px-4 pb-4 bg-[#BABFBF] m-5 dark:bg-[#30323D] shadow-lg rounded-lg border-none transition-all hover:shadow-xl">
                        <div className="flex items-center mb-2 border-b p-4 gap-2 justify-between">
                            <span className=""></span> 
                            <span className="display-font flex justify-center items-center gap-2 text-xl font-semibold"> 
                                <SiGooglegemini className="text-2xl" /> Gemini Generative AI 
                            </span>
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                            <HiOutlineDotsVertical className="hover:text-red-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#BABFBF] dark:bg-[#30323D] rounded-lg shadow-lg">
                                        <DropdownMenuItem className="hover:cursor-pointer hover:text-red-500 rounded-md transition-colors">
                                            <Dialog>
                                                <DialogTrigger onClick={(e) => e.stopPropagation()} className="hover:cursor-pointer hover:text-red-500 w-full">
                                                    <span className="flex items-center justify-start gap-2 px-2 py-1 w-full">
                                                        <FaTrash /> Delete all chat
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="md:w-full w-[330px] bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="display-font text-xl">Delete all chat?</DialogTitle>
                                                        <DialogDescription className="text-base">
                                                            Your chat will be deleted permanently. This action cannot be undone.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                        <Button onClick={handleClearChat} className="flex justify-center items-center gap-1 hover:bg-red-500 transition-colors">Delete <FaTrash /></Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-md transition-colors">
                                            <Dialog>
                                                <DialogTrigger onClick={(e) => e.stopPropagation()} className="w-full">
                                                    <span className="flex items-center justify-start gap-2 px-2 py-1 w-full">
                                                        <FaInfoCircle /> About
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="md:w-full w-[330px] bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="display-font text-xl">About</DialogTitle>
                                                        <DialogDescription className="py-3 text-left text-base">
                                                            Just a simple chatbot for asking anything to Google Gemini model through Google AI Studio API Key. <br /> <br />
                                                            <p className='flex items-center gap-1'> <FaRegStar />GitHub repository: <a className='underline hover:text-blue-500 transition-colors' href="https://github.com/arifian853/simple-ai-chat" target='_blank'> https://github.com/arifian853/simple-ai-chat</a> </p>
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div 
                            ref={chatContainerRef} 
                            className="overflow-y-auto md:max-h-[700px] max-h-[500px] md:p-4 p-3 rounded-lg bg-[#E0E0E0]/50 dark:bg-[#1C1D24]/50 mb-4"
                        >
                            {messages.map((message: Message, index: Key | null | undefined) => (
                                <div
                                    key={index}
                                    className={`mb-4 flex items-start ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    {message.sender === 'bot' && (
                                        <span className={`text-3xl border-2 p-1 mr-2 rounded-full ${message.isThinking
                                            ? 'border-yellow-500 animate-pulse'
                                            : 'border-b-cyan-500 border-r-cyan-400 border-t-cyan-300 border-l-cyan-200'
                                            } shadow-md`}>
                                            <SiGooglegemini />
                                        </span>
                                    )}
                                    <div
                                        className={`md:text-base text-sm inline-block px-4 py-3 rounded-lg relative group ${message.sender === 'bot'
                                            ? message.isThinking
                                                ? 'bg-yellow-100 dark:bg-yellow-900 animate-pulse'
                                                : message.isLoading
                                                    ? 'bg-blue-100 dark:bg-blue-900 animate-pulse'
                                                    : 'bg-gray-300 dark:bg-gray-700'
                                            : 'bg-[#1C1D24] text-white'
                                            } shadow-md max-w-[85%]`}
                                    >
                                        <button
                                            onClick={() => copyToClipboard(String(message.text))}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                                            title="Copy to clipboard"
                                        >
                                            <FaCopy size={14} />
                                        </button>
                                        <Markdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            className="prose dark:prose-invert prose-sm md:prose-base max-w-none"
                                        >
                                            {typeof message.text === 'string'
                                                ? message.text
                                                : String(message.text)}
                                        </Markdown>
                                    </div>
                                    {message.sender === 'user' && (
                                        <span className='text-3xl border-2 p-1 ml-2 rounded-full border-b-orange-500 border-r-orange-400 border-t-orange-300 border-l-orange-200 shadow-md'>
                                            <SiGooglegemini />
                                        </span>
                                    )}
                                </div>
                            ))}
                            {errorMessage && (
                                <div className="text-red-500 text-center mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center items-center gap-2 p-2">
                            {responseTime > 0 && (
                                <p className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                                    Model response time: {(responseTime / 1000).toFixed(2)}s
                                </p>
                            )}
                        </div>
                        <div className="flex items-center border-t p-4 justify-center md:flex-row flex-col gap-3">
                            {
                                isResponding ? (
                                    <div className="loader"></div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {renderedSuggestions.map((text, index) => (
                                            <a
                                                key={index}
                                                data-aos="fade-in"
                                                data-aos-duration='900'
                                                onClick={() => handleSuggestionClick(text.message)}
                                                className={`dark:bg-[#1C1D24] bg-[#E0E0E0] dark:text-white text-black px-4 py-2 rounded-full text-sm text-center hover:cursor-pointer border dark:border-white border-black transition-all hover:shadow-md`}
                                            >
                                                {text.message}
                                            </a>
                                        ))}
                                        <a 
                                            onClick={() => handleNewSuggestions()} 
                                            className="hover:cursor-pointer text-xl bg-gray-200 dark:bg-gray-800 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                            title="Refresh suggestions"
                                        >
                                            <MdRefresh />
                                        </a>
                                    </div>
                                )
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Write message...."
                                    className="flex-1 md:text-base text-sm bg-white dark:bg-black rounded-full pl-4 pr-12 py-6 shadow-md focus:ring-2 focus:ring-blue-500 transition-all"
                                    disabled={isResponding || isModelLoading}
                                />
                            </div>
                            {isResponding ? (
                                <Button 
                                    onClick={handleStopGeneration} 
                                    className="ml-2 flex gap-2 justify-center items-center bg-red-500 hover:bg-red-600 rounded-full px-5 py-6 shadow-md transition-all"
                                >
                                    Stop
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleSend} 
                                    className="ml-2 flex gap-2 justify-center items-center rounded-full px-5 py-6 shadow-md transition-all" 
                                    disabled={isResponding || isModelLoading}
                                >
                                    Send <MdSend />
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col items-center mt-6 gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline" className="relative rounded-full shadow-md hover:shadow-lg transition-all">
                                        <span className="flex items-center gap-2">
                                            <SiGooglegemini className="text-lg" />
                                            Model: {availableModels.find(model => model.value === selectedModel)?.name || 'Select Model'}
                                            <FaAngleDown className="ml-1" />
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#BABFBF] dark:bg-[#30323D] rounded-lg shadow-lg">
                                    {availableModels.map((model) => (
                                        <DropdownMenuItem
                                            key={model.value}
                                            onClick={() => handleModelChange(model.value)}
                                            className="hover:cursor-pointer hover:text-red-500 relative rounded-md transition-colors"
                                        >
                                            {model.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <p className="text-center opacity-75 text-xs mt-1 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                                Pesan tersisa: {10 - messageLimit.messageCount} / 10
                            </p>
                        </div>
                    </Card>
                    <p className="text-center w-full opacity-75 text-xs bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full max-w-md">
                        <span className="border-b border-yellow-500 font-semibold">Warning:</span> Do not abuse! Please use only 10 message.
                    </p>
                </div>
            </div>
        </>
    );
};