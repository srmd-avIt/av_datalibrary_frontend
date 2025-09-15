import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Send, Bot, User, Users, Sparkles, Clock, TrendingUp, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuerySuggestion {
  id: string;
  text: string;
  category: string;
  icon: any;
}

const querySuggestions: QuerySuggestion[] = [
  { id: "1", text: "How many satsangs happened in 2024?", category: "Analytics", icon: TrendingUp },
  { id: "2", text: "Which country has the most pratishthas?", category: "Geography", icon: MapPin },
  { id: "3", text: "Total satsang hours by month this year", category: "Time Analysis", icon: Clock },
  { id: "4", text: "Show me cities with highest attendance", category: "Demographics", icon: Users },
  { id: "5", text: "Compare satsang activity across continents", category: "Comparison", icon: TrendingUp },
  { id: "6", text: "Which speakers conducted most sessions?", category: "People", icon: User },
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Welcome to the AI Assistant! I can help you analyze your satsang data. Ask me questions like 'How many satsangs happened in 2024?' or 'Which country has the most pratishthas?'",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("satsang") && (lowerQuery.includes("2024") || lowerQuery.includes("2025"))) {
      return "Based on the data analysis, there were 487 satsangs conducted in 2024, with a total of 6,500 hours. The peak months were October (68 sessions) and November (72 sessions) during the festival season.";
    }
    
    if (lowerQuery.includes("country") && lowerQuery.includes("pratishthas")) {
      return "India leads with 125 pratishthas, followed by the United States with 45, and the United Kingdom with 23. These three countries account for 78% of all global pratishthas.";
    }
    
    if (lowerQuery.includes("total") && lowerQuery.includes("hours")) {
      return "This year's monthly breakdown: Jan (420h), Feb (380h), Mar (510h), Apr (580h), May (620h), Jun (550h), Jul (480h), Aug (590h), Sep (640h), Oct (720h), Nov (760h), Dec (540h). Total: 6,790 hours.";
    }
    
    if (lowerQuery.includes("cities") && lowerQuery.includes("attendance")) {
      return "Top cities by attendance: Mumbai (avg 485 per session), Delhi (avg 412), London (avg 298), New York (avg 267), Toronto (avg 198). These cities show consistently high engagement rates.";
    }
    
    if (lowerQuery.includes("continent")) {
      return "Continental distribution: Asia leads with 3,200 total hours (45%), North America with 1,800 hours (26%), Europe with 950 hours (14%), followed by Oceania, Africa, and South America.";
    }
    
    if (lowerQuery.includes("speaker")) {
      return "Most active speakers: Pujya Swami Ji (128 sessions), Sant Maharaj (95 sessions), Acharya Patel (78 sessions), and Brahmin Sharma (64 sessions). Average session duration is 2.3 hours.";
    }
    
    return "I've analyzed your query and here's what I found in the database. For more specific insights, please try rephrasing your question or ask about countries, cities, satsang hours, attendance, or speakers.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateResponse(input.trim()),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setInput(suggestion.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about your satsang data and get instant insights powered by AI
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted p-3 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your satsang data..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {querySuggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <motion.div
                    key={suggestion.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-all duration-200 hover:bg-muted/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-relaxed">{suggestion.text}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Queries</span>
                <Badge>1,247</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <Badge variant="secondary">89</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response</span>
                <Badge variant="outline">1.2s</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}