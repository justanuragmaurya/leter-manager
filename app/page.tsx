"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Mail, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isPast, isToday, isFuture } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllLetters, addLetter, updateLetter } from "@/lib/db";

interface Letter {
  id: string;
  letterNumber: string;
  senderName: string;
  subject: string;
  dateSent: Date;
  expectedReplyDate: Date;
  sectionNumber: string;
  received: boolean;
}

export default function Home() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [letterNumber, setLetterNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [subject, setSubject] = useState("");
  const [dateSent, setDateSent] = useState<Date>();
  const [expectedReplyDate, setExpectedReplyDate] = useState<Date>();
  const [sectionNumber, setSectionNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      const data = await getAllLetters();
      setLetters(data.map(letter => ({
        ...letter,
        dateSent: new Date(letter.dateSent),
        expectedReplyDate: new Date(letter.expectedReplyDate),
      })));
    } catch (error) {
      console.error('Error fetching letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateSent || !expectedReplyDate) return;

    try {
      await addLetter({
        letterNumber,
        senderName,
        subject,
        dateSent,
        expectedReplyDate,
        sectionNumber,
        received: false,
      });

      // Reset form
      setLetterNumber("");
      setSenderName("");
      setSubject("");
      setDateSent(undefined);
      setExpectedReplyDate(undefined);
      setSectionNumber("");
      // Refresh letters
      fetchLetters();
    } catch (error) {
      console.error('Error creating letter:', error);
    }
  };

  const markAsReceived = async (id: string) => {
    try {
      await updateLetter(id, { received: true });
      fetchLetters();
    } catch (error) {
      console.error('Error marking letter as received:', error);
    }
  };

  const pendingLetters = letters.filter(letter => !letter.received);
  const receivedLetters = letters.filter(letter => letter.received);

  const dueTodayLetters = pendingLetters.filter(letter => 
    isToday(new Date(letter.expectedReplyDate))
  );

  const overdueLetters = pendingLetters.filter(letter => 
    isPast(new Date(letter.expectedReplyDate)) && !isToday(new Date(letter.expectedReplyDate))
  );

  const upcomingLetters = pendingLetters.filter(letter => 
    isFuture(new Date(letter.expectedReplyDate))
  );

  const renderLetterList = (letterList: Letter[]) => (
    <div className="space-y-4">
      {letterList.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No letters found
        </p>
      ) : (
        letterList.map((letter) => (
          <Card key={letter.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium block">Letter #{letter.letterNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    From: {letter.senderName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isPast(new Date(letter.expectedReplyDate)) && !isToday(new Date(letter.expectedReplyDate)) && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                  {isToday(new Date(letter.expectedReplyDate)) && (
                    <Badge variant="default">Due Today</Badge>
                  )}
                  {isFuture(new Date(letter.expectedReplyDate)) && (
                    <Badge variant="secondary">Upcoming</Badge>
                  )}
                  <span className="text-muted-foreground text-sm">
                    Section {letter.sectionNumber}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium">{letter.subject}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                  <p>Sent: {format(new Date(letter.dateSent), "PPP")}</p>
                  <p>Expected Reply: {format(new Date(letter.expectedReplyDate), "PPP")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsReceived(letter.id)}
                  className="ml-4"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Received
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add New Letter</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Letter Number</label>
              <Input
                value={letterNumber}
                onChange={(e) => setLetterNumber(e.target.value)}
                placeholder="Enter letter number"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sender's Name</label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Enter sender's name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Sent</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateSent && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateSent ? format(dateSent, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateSent}
                    onSelect={setDateSent}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expected Reply Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedReplyDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedReplyDate ? format(expectedReplyDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedReplyDate}
                    onSelect={setExpectedReplyDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section Number</label>
              <Input
                value={sectionNumber}
                onChange={(e) => setSectionNumber(e.target.value)}
                placeholder="Enter section number"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Add Letter
            </Button>
          </form>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Mail className="mr-2" />
                Pending Letters
              </h2>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    All ({pendingLetters.length})
                  </TabsTrigger>
                  <TabsTrigger value="today" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due Today ({dueTodayLetters.length})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Overdue ({overdueLetters.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Upcoming ({upcomingLetters.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  {renderLetterList(pendingLetters)}
                </TabsContent>
                <TabsContent value="today" className="mt-6">
                  {renderLetterList(dueTodayLetters)}
                </TabsContent>
                <TabsContent value="overdue" className="mt-6">
                  {renderLetterList(overdueLetters)}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-6">
                  {renderLetterList(upcomingLetters)}
                </TabsContent>
              </Tabs>
            </div>

            {receivedLetters.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center">
                  <CheckCircle2 className="mr-2" />
                  Received Letters
                </h3>
                <div className="space-y-4">
                  {receivedLetters.map((letter) => (
                    <Card key={letter.id} className="p-4 bg-muted">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium block">Letter #{letter.letterNumber}</span>
                            <span className="text-sm text-muted-foreground">
                              From: {letter.senderName}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            Section {letter.sectionNumber}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{letter.subject}</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Sent: {format(new Date(letter.dateSent), "PPP")}</p>
                          <p>Expected Reply: {format(new Date(letter.expectedReplyDate), "PPP")}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}