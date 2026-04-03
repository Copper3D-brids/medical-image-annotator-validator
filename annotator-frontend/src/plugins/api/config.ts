import http from "./client";
import {
    IToolConfig,
    IToolConfigResponse,
    ISSEProgressEvent,
    ISSECompleteEvent,
    ISSEErrorEvent,
} from "@/models";
import { getApiBaseUrl } from "./getBaseUrl";

export function useToolConfig(config: IToolConfig) {
    return http.post<IToolConfigResponse>("/tool-config", config);
}

export interface ToolConfigSSECallbacks {
    onProgress: (event: ISSEProgressEvent) => void;
    onComplete: (event: ISSECompleteEvent) => void;
    onError: (event: ISSEErrorEvent) => void;
}

export async function useToolConfigSSE(
    config: IToolConfig,
    callbacks: ToolConfigSSECallbacks
): Promise<void> {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/tool-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let parsed: any;
        try { parsed = JSON.parse(errorText); } catch { parsed = null; }
        callbacks.onError({
            step: "connection",
            summary: parsed?.detail?.summary ?? `HTTP ${response.status}`,
            detail: parsed?.detail?.detail ?? errorText,
        });
        return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!;

        for (const part of parts) {
            let eventType = "";
            let eventData = "";
            for (const line of part.split("\n")) {
                if (line.startsWith("event: ")) eventType = line.slice(7);
                else if (line.startsWith("data: ")) eventData = line.slice(6);
            }
            if (!eventType || !eventData) continue;

            const data = JSON.parse(eventData);
            if (eventType === "progress") callbacks.onProgress(data);
            else if (eventType === "complete") callbacks.onComplete(data);
            else if (eventType === "error") callbacks.onError(data);
        }
    }
}
