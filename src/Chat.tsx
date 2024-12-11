/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction, useEffect, useRef, useState, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Input } from './components/ui/input';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { MdRefresh, MdSend } from "react-icons/md";
import { FaAngleDown, FaTrash } from "react-icons/fa6";
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

interface MessageLimitState {
    messageCount: number;
    lastResetTimestamp: number;
}

export const Chat = () => {
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

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

    const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash-002");

    const availableModels = [
        { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
        { name: "Gemini 1.5 Flash 8B", value: "gemini-1.5-flash-8b" },
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

        try {
            const model = genAI.getGenerativeModel({ model: selectedModel });
            const result = await model.generateContent(input);
            const response = await result.response;
            const botResponse = await response.text();
            simulateBotResponse(botResponse);

            setMessageLimit(prev => ({
                messageCount: prev.messageCount + 1,
                lastResetTimestamp: prev.lastResetTimestamp
            }));

        } catch (error) {
            console.error("Service is unreachable.", error);
            simulateBotResponse("Service is unreachable.");
        }

    };

    const simulateBotResponse = (responseText: string) => {
        const startTime = Date.now();
        setIsResponding(true);
        setMessages((prev: any) => [...prev, { sender: 'bot', text: '' }]);

        let index = 0;
        const interval = setInterval(() => {
            if (index < responseText.length) {
                setMessages((prevMessages: any) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = {
                        ...updatedMessages[updatedMessages.length - 1],
                        text: responseText.slice(0, index + 1)
                    };
                    return updatedMessages;
                });

                index++;
            } else {
                clearInterval(interval);
                const endTime = Date.now();
                setResponseTime(endTime - startTime);
                setIsResponding(false);
            }
        }, 15);
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
            <div className="bg-[#E0E0E0] dark:bg-[#1C1D24] h-auto flex justify-center items-center p-5">
                <div className="min-h-screen h-auto w-full flex items-center md:justify-center justify-start flex-col bg-[#E0E0E0] dark:bg-[#1C1D24]">
                    <div className='bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-full px-4 py-2'>
                        <ModeToggle />
                    </div>
                    <Card data-aos="fade-out" data-aos-duration='900' className="md:w-2/3 w-full px-4 pb-4 bg-[#BABFBF] m-5 dark:bg-[#30323D] shadow-lg rounded-lg border-none">
                        <div className="flex items-center mb-2 border-b p-4 gap-2 justify-between">
                            <span className=""></span> <span className="display-font flex justify-center items-center gap-1"> Gemini Generative AI </span>
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger><HiOutlineDotsVertical className="hover:text-red-500" /></DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#BABFBF] dark:bg-[#30323D]">
                                        <DropdownMenuItem className="hover:cursor-pointer hover:text-red-500">
                                            <Dialog>
                                                <DialogTrigger onClick={(e) => e.stopPropagation()} className="hover:cursor-pointer hover:text-red-500">
                                                    <span className="flex items-center justify-center gap-2">
                                                        <FaTrash /> Delete all chat
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="md:w-full w-[330px] bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="display-font">Delete all chat?</DialogTitle>
                                                        <DialogDescription>
                                                            Your chat will be deleted permanently. This action cannot be undone.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                        <Button onClick={handleClearChat} className="flex justify-center items-center gap-1 hover:bg-red-500">Delete <FaTrash /></Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Dialog>
                                                <DialogTrigger onClick={(e) => e.stopPropagation()}>
                                                    <span className="flex items-center justify-center gap-2">
                                                        <FaInfoCircle /> About
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="md:w-full w-[330px] bg-[#BABFBF] dark:bg-[#30323D] shadow-lg rounded-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="display-font">About</DialogTitle>
                                                        <DialogDescription className="py-3 text-left">
                                                            Just a simple chatbot for asking anything to Google Gemini model through Google AI Studio API Key
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div ref={chatContainerRef} className="overflow-y-auto md:max-h-[700px] max-h-[500px] md:p-3 p-2">

                            {messages.map((message: { sender: string; text: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined; }, index: Key | null | undefined) => (
                                <div
                                    key={index}
                                    className={`mb-2 flex items-center ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    {message.sender === 'bot' && (
                                        <span className='text-3xl border-2 p-1 mr-1 rounded-full'>
                                            <SiGooglegemini />
                                        </span>
                                    )}
                                    <div
                                        className={`md:text-base text-sm inline-block px-3 py-2 rounded-lg ${message.sender === 'bot'
                                            ? 'bg-gray-300 dark:bg-gray-700'
                                            : 'bg-[#1C1D24] text-white'
                                            }`}
                                    >
                                        <Markdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {typeof message.text === 'string'
                                                ? message.text
                                                : String(message.text)}
                                        </Markdown>
                                    </div>
                                    {message.sender === 'user' && (
                                        <span className='text-3xl border-2 p-1 ml-1 rounded-full'>
                                            <SiGooglegemini />
                                        </span>
                                    )}
                                </div>
                            ))}
                            {errorMessage && (
                                <div className="text-red-500 text-center mb-4">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center items-center gap-2 p-4">
                            {responseTime > 0 && (
                                <p className="text-xs text-gray-500">
                                    Model response time: {responseTime / 1000} s
                                </p>
                            )}
                        </div>
                        <div className="flex items-center border-t p-4 justify-center md:flex-row flex-col gap-2">

                            {
                                isResponding ? (
                                    <div className="loader"></div>
                                ) : (
                                    renderedSuggestions.map((text, index) => (
                                        <a
                                            key={index}
                                            data-aos="fade-in"
                                            data-aos-duration='900'
                                            onClick={() => handleSuggestionClick(text.message)}
                                            className={`mr-2 dark:bg-[#1C1D24] bg-[#E0E0E0] dark:text-white text-black px-3 py-1 rounded-full text-sm text-center hover:cursor-pointer border dark:border-white border-black`}
                                        >
                                            {text.message}
                                        </a>
                                    ))
                                )
                            }
                            {
                                isResponding ? (
                                    <></>
                                ) : (
                                    <a onClick={() => handleNewSuggestions()} className="mr-2 hover:cursor-pointer text-xl"><MdRefresh /></a>
                                )
                            }
                        </div>
                        <div className="flex items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Write message...."
                                className="flex-1 md:text-base text-sm bg-white dark:bg-black"
                                disabled={isResponding}
                            />
                            <Button onClick={handleSend} className="ml-2 flex gap-2 justify-center items-center" disabled={isResponding}>
                                Send <MdSend />
                            </Button>
                        </div>

                        <p className="text-center w-full opacity-55 text-xs mt-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline">
                                        Model : {availableModels.find(model => model.value === selectedModel)?.name || 'Select Model'} <FaAngleDown />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#BABFBF] dark:bg-[#30323D]">
                                    {availableModels.map((model) => (
                                        <DropdownMenuItem
                                            key={model.value}
                                            onClick={() => handleModelChange(model.value)}
                                            className="hover:cursor-pointer hover:text-red-500"
                                        >
                                            {model.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </p>
                        <p className="text-center w-full opacity-55 text-xs mt-2">
                            Pesan tersisa: {10 - messageLimit.messageCount} / 10
                        </p>
                    </Card>
                    <p className="text-center w-full opacity-55 text-xs">
                        <span className="border-b border-yellow-500">Warning:</span> Do not abuse! Please use only 10 message.<br />
                    </p>
                </div>
            </div>
        </>
    );
};