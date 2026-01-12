"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function DemoPage() {
    const { userId } = useAuth()

    const [loading, setLoading] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const handleBlocking = async () => {
        setLoading(true);
        await fetch('/api/demo/blocking', {
            method: 'POST',
        })
        setLoading(false);
    }
    const handleBackground = async () => {
        setLoading2(true);
        await fetch('/api/demo/background', {
            method: 'POST',
        })
        setLoading2(false);
    }

    const handleClientError = () => {
        Sentry.logger.info("User attemp to click on client error function", { userId })
        throw new Error("This is a client-side error something went wrong in the browser");
    }
    const handleApiError = async () => {
        await fetch("/api/demo/error", {
            method: "POST"
        })
    }
    const handleInngestError = async () => {
        await fetch("/api/demo/inngest-error", {
            method: "POST"
        })
    }
    return (
        <div className="p-8 space-x-4">
            <Button
                disabled={loading}
                onClick={handleBlocking}
            >
                {loading ? 'Generating...' : 'Generate Blocking Text'}
            </Button>
            <Button
                disabled={loading2}
                onClick={handleBackground}
            >
                {loading2 ? 'Generating...' : 'Generate Background Text'}
            </Button>
            <Button
                variant="destructive"
                onClick={handleClientError}
            >
                Client Error
            </Button>
            <Button
                variant="destructive"
                onClick={handleApiError}
            >
                API Error
            </Button>
            <Button
                variant="destructive"
                onClick={handleInngestError}
            >
                Inngest Error
            </Button>
        </div>
    )
}