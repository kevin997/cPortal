"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
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
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Something went wrong</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        An unexpected error occurred. You can try again.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={reset}>Try again</Button>
                        <Button variant="secondary" asChild>
                            <Link href="/">Go home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
