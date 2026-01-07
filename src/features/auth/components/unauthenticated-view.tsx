import { ShieldAlertIcon } from "lucide-react";

import {
    Item,
    ItemDescription,
    ItemTitle,
    ItemMedia,
    ItemContent,
    ItemActions
} from "@/components/ui/item";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-lg bg-muted">
                <Item variant="outline">
                    <ItemMedia variant="icon">
                        <ShieldAlertIcon className="h-12 w-12 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>Unauthorized access</ItemTitle>
                        <ItemDescription>Please sign in to continue.</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <SignInButton>
                            <Button variant="outline" size="sm" >
                                Sign in
                            </Button>
                        </SignInButton>
                    </ItemActions>
                </Item>
            </div>
        </div>

    );
};