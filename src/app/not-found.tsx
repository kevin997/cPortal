import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Page not found</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The page you are looking for doesn’t exist or has been moved.
                    </p>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/">Go home</Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
