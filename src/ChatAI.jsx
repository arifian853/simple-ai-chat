import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from 'react-markdown'


import { IoMdSend } from "react-icons/io";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

export const ChatAI = () => {
    const [generatedText, setGeneratedText] = useState("Hello! What do you want to ask today?");
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState(""); // New state for input text

    const generateStory = async (prompt) => {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        setGeneratedText(text);
        setLoading(false)
    };

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleSubmit = () => {
        setLoading(true)
        generateStory(inputText);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <br />

            <div className="md:w-2/3 w-11/12 md:max-h-[500px] max-h-[350px] overflow-auto md:pr-3 pr-0 rounded-sm">
                {loading ? (
                    <div className="loader pb-3"></div>
                ) : (
                    <p className="border-r-slate-800 bg-slate-700 p-3 text-white rounded-md">
                        <Markdown>{generatedText}</Markdown>
                    </p>
                )}
            </div>
            <br />
            <div className="flex flex-col items-center absolute bottom-0 m-5 md:w-2/3 w-11/12">
                <div className="flex row items-center w-full">
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Enter your message..."
                        className="border-r-slate-800 bg-slate-700 p-3 text-white rounded-md mr-2 md:w-full w-full"
                    />
                    <button
                        onClick={handleSubmit}
                        className="border-r-slate-800 bg-slate-700 p-3 text-white rounded-md flex items-center gap-3"
                    >
                        Send <IoMdSend />
                    </button>
                </div>
                <span className='m-3 text-sm opacity-65 text-center'>Copyright © <a className='underline' href="https://arifian853.vercel.app" target='_blank'>Arifian Saputra</a>, {new Date().getFullYear()}. All rights reserved | <a className='underline' href="https://github.com/arifian853/simple-ai-chat" target='_blank'>Repository</a></span>
            </div>
        </div>
    );
};
