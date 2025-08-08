import { Check, Wifi, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  
  const selectedRelays = config.relayUrls;
  const setSelectedRelays = (relays: string[]) => {
    updateConfig((current) => ({ ...current, relayUrls: relays }));
  };

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
    const normalizedUrl = normalizeRelayUrl(url);
    if (!selectedRelays.includes(normalizedUrl)) {
      setSelectedRelays([...selectedRelays, normalizedUrl]);
    }
    setOpen(false);
    setInputValue("");
  };

  // Handle removing a relay
  const handleRemoveRelay = (url: string) => {
    setSelectedRelays(selectedRelays.filter(relay => relay !== url));
  };

  // Handle toggling a relay
  const handleToggleRelay = (url: string) => {
    const normalizedUrl = normalizeRelayUrl(url);
    if (selectedRelays.includes(normalizedUrl)) {
      handleRemoveRelay(normalizedUrl);
    } else {
      handleAddCustomRelay(normalizedUrl);
    }
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

  // Get display name for a relay URL
  const getRelayDisplayName = (url: string) => {
    const preset = presetRelays.find(r => r.url === url);
    return preset ? preset.name : url.replace(/^wss?:\/\//, '');
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
                className={cn("h-8 w-8 relative mr-2", className)}
              >
                <Wifi className="h-4 w-4" />
                {selectedRelays.length > 1 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    {selectedRelays.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="end">
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm">Relay Settings</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedRelays.length} relay{selectedRelays.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Selected Relays */}
              {selectedRelays.length > 0 && (
                <div className="p-3 border-b">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Active Relays</h4>
                  <div className="space-y-1">
                    {selectedRelays.map((relay) => (
                      <div key={relay} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-xs truncate flex-1">
                          {getRelayDisplayName(relay)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRelay(relay)}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                          onSelect={() => handleToggleRelay(option.url)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRelays.includes(option.url) ? "opacity-100" : "opacity-0"
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
          <p>Relay Settings ({selectedRelays.length} active)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}