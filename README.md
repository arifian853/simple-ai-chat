<h1 align="center"> Google Generative Language API (Gemini API) </h1>
<p align="center"> Just a simple chatbot for asking anything to Google Gemini model through Google AI Studio API Key. </p>

<div align="center">
  <h1>Gemini AI Chat Interface</h1>
  <p>A modern, responsive chat interface for Google's Gemini AI models</p>

  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB">
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white">
</div>

## 📋 Overview

This project provides a clean, user-friendly interface for interacting with Google's Gemini AI models. Built with React, TypeScript, and Tailwind CSS, it offers a responsive design that works across devices.

![Usage](https://github.com/arifian853/simple-ai-chat/blob/master/public/usages.jpg)

## ✨ Features

- **Multiple Gemini Models**: Support for various Gemini models including 1.5 Pro, Flash, and experimental versions
- **Real-time Typing Animation**: Simulates natural typing for a more engaging experience
- **Markdown Support**: Full markdown rendering with math equation support via KaTeX
- **Dark/Light Mode**: Toggle between themes for comfortable viewing in any environment
- **Message History**: Chat history is saved in local storage for persistent conversations
- **Copy to Clipboard**: Easily copy any response with a single click
- **Conversation Suggestions**: Dynamic suggestions to help start or continue conversations
- **Usage Limits**: Built-in message limits to prevent API abuse
- **Stop Generation**: Ability to stop response generation mid-stream

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google AI Studio API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arifian853/simple-ai-chat.git
   cd simple-ai-chat
   ```
- Find your Google AI Studio API Key here : https://aistudio.google.com/
- Change the ```.env.example``` file to ```.env```
- Replace the ```VITE_API_KEY``` value on  ```.env``` file with the Google AI Studio API Key you have obtained.

```
VITE_API_KEY=your-api-key
``` 

Example : 
![Usage](https://github.com/arifian853/simple-ai-chat/blob/master/public/usages.jpg)

## 🔑 API Key
To use this application, you'll need a Google AI Studio API key:

1. Visit Google AI Studio
2. Create or sign in to your account
3. Navigate to API keys section
4. Generate a new API key
5. Copy the key and add it to your .env file
## 💻 Usage
- Type your message in the input field and press Enter or click Send
- Click on any of the suggested prompts to quickly start a conversation
- Use the model selector to switch between different Gemini models
- Toggle between light and dark mode using the theme switch
- Clear your conversation history using the menu in the top right
- Copy any response by hovering over it and clicking the copy icon
## 🛠️ Technologies
- React : UI library for building the interface
- TypeScript : For type-safe code
- Tailwind CSS : For styling
- Google Generative AI SDK : For connecting to Gemini models
- React Markdown : For rendering markdown in responses
- KaTeX : For rendering mathematical equations
## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

## 📞 Contact
GitHub: arifian853

Made with ❤️ for the AI community