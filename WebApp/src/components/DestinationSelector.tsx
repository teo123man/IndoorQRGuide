import { DESTINATIONS } from "@/lib/navigator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "lucide-react";

interface DestinationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  status: string;
}

export const DestinationSelector = ({
  value,
  onChange,
  status,
}: DestinationSelectorProps) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border-t border-border">
      <Navigation className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {DESTINATIONS.map((dest) => (
              <SelectItem key={dest} value={dest}>
                {dest}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:block">
        {status}
      </span>
    </div>
  );
};
