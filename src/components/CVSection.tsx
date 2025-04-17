import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CVSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}

const CVSection = ({ title, children, collapsible = true }: CVSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card className="mb-4 shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base md:text-lg font-medium">{title}</CardTitle>
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="px-4 py-3">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export default CVSection;
