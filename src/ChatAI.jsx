import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from 'react-markdown'

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
        <div className="flex flex-col">
            <br />

            {loading ? (
                <div className="loader pb-3"></div>
            ) : (
                <p className="w-2/3 border-r-slate-800 bg-slate-700 p-3 text-white rounded-md">
                    <Markdown>{generatedText}</Markdown>
                </p>
            )}
            <br />
            <div className="flex items-center">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Enter your message..."
                    className="border-r-slate-800 bg-slate-700 p-3 text-white rounded-md mr-2 w-full"
                />
                <button
                    onClick={handleSubmit}
                    className="border-r-slate-800 bg-slate-700 p-3 text-white rounded-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
};
