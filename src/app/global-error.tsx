"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body className="antialiased">
                <div className="min-h-screen flex items-center justify-center px-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Application error</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                The application crashed unexpectedly. You can try to recover.
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={reset}>Reload</Button>
                                <Button variant="secondary" asChild>
                                    <Link href="/">Go home</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    );
}
