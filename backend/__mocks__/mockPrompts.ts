import {Language} from "@prisma/client";
import {GeminiResponseType} from "../../src/types/promptTypes";


export const promptInput = {
    role: "Test Role",
    context: "Some context",
    task: "Test task",
    output: "Expected output",
    constraints: "None",
    language: Language.EN,
    score: 0,
    geminiText: null,
    geminiSummary: null,
};

export const validPrompt = {
    role: "Test Role",
    context: "Some context",
    task: "Test task",
    output: "Expected output",
    constraints: "None",
    language: Language.EN,
    score: 0,
    geminiText: "Gemini text",
    geminiSummary: "Gemini summary",
};

export const mockGeminiResponse: GeminiResponseType = {
    text: "some long response...",
    summary: "short summary",
};

export const getMockPrompt = (userId: string) => ({
    id: "mock-prompt-id",
    userId,
    role: "Sample Role",
    context: "Sample context",
    task: "Sample task",
    output: "Sample output",
    constraints: "Sample constraints",
    language: Language.EN,
    score: 5,
    geminiText: "Sample text",
    geminiSummary: "Short summary",
    createdAt: new Date().toISOString(),
});

export const getMockPromptList = (userId: string) => [
    getMockPrompt(userId),
    {
        ...getMockPrompt(userId),
        id: "mock-prompt-id-2",
        task: "Another test task",
        geminiSummary: "Another summary",
    },
];

