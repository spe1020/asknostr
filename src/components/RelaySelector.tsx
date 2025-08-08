import { Check, Wifi, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RelaySelectorProps {
  className?: string;
}

export function RelaySelector(props: RelaySelectorProps) {
  const { className } = props;
  const { config, updateConfig, presetRelays = [] } = useAppContext();
  
  const selectedRelay = config.relayUrl;
  const setSelectedRelay = (relay: string) => {
    updateConfig((current) => ({ ...current, relayUrl: relay }));
  };

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedOption = presetRelays.find((option) => option.url === selectedRelay);

  // Function to normalize relay URL by adding wss:// if no protocol is present
  const normalizeRelayUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    
    // Check if it already has a protocol
    if (trimmed.includes('://')) {
      return trimmed;
    }
    
    // Add wss:// prefix
    return `wss://${trimmed}`;
  };

  // Handle adding a custom relay
  const handleAddCustomRelay = (url: string) => {
    setSelectedRelay?.(normalizeRelayUrl(url));
    setOpen(false);
    setInputValue("");
  };

  // Check if input value looks like a valid relay URL
  const isValidRelayInput = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    
    // Basic validation - should contain at least a domain-like structure
    const normalized = normalizeRelayUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", className)}
              >
                <Wifi className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm">Relay Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Current: {selectedOption?.name || selectedRelay?.replace(/^wss?:\/\//, '') || 'None'}
                </p>
              </div>
              <Command>
                <CommandInput 
                  placeholder="Search relays or type URL..." 
                  value={inputValue}
                  onValueChange={setInputValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {inputValue && isValidRelayInput(inputValue) ? (
                      <CommandItem
                        onSelect={() => handleAddCustomRelay(inputValue)}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">Add custom relay</span>
                          <span className="text-xs text-muted-foreground">
                            {normalizeRelayUrl(inputValue)}
                          </span>
                        </div>
                      </CommandItem>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {inputValue ? "Invalid relay URL" : "No relay found."}
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {presetRelays
                      .filter((option) => 
                        !inputValue || 
                        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                        option.url.toLowerCase().includes(inputValue.toLowerCase())
                      )
                      .map((option) => (
                        <CommandItem
                          key={option.url}
                          value={option.url}
                          onSelect={(currentValue) => {
                            setSelectedRelay(normalizeRelayUrl(currentValue));
                            setOpen(false);
                            setInputValue("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRelay === option.url ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-xs text-muted-foreground">{option.url}</span>
                          </div>
                        </CommandItem>
                      ))}
                    {inputValue && isValidRelayInput(inputValue) && (
                      <CommandItem
                        onSelect={() => handleAddCustomRelay(inputValue)}
                        className="cursor-pointer border-t"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">Add custom relay</span>
                          <span className="text-xs text-muted-foreground">
                            {normalizeRelayUrl(inputValue)}
                          </span>
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          <p>Relay Settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}