"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion } from "framer-motion";
// Add these imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  options: z.array(z.string().min(1, "Option cannot be empty")).length(2),
});

export function CreateContestForm() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  // Add these state variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voteUrl, setVoteUrl] = useState("");

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      options: ["", ""],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/vote-creation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create vote");
      }

      const data = await response.json();
      console.log("Vote created:", data);

      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        const newVoteUrl = `${window.location.origin}/advanced/${data.voteId}`;
        setVoteUrl(newVoteUrl);
        setIsModalOpen(true);
      }, 3000);
    } catch (error) {
      console.error("Error creating vote:", error);
      alert("Failed to create vote. Please try again.");
    }
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 0.95 },
    tap: { scale: 0.9 },
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
      {showConfetti && <Confetti />}
      <motion.div
        className={`
          relative rounded-2xl p-1
          ${isAnimating ? "animate-gradient-x" : ""}
          bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#9945FF]
          bg-[length:200%_100%]
        `}
        initial="hidden"
        animate="visible"
        variants={formVariants}
      >
        <div className="bg-[#2C2C2C] rounded-2xl p-2 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="The topic of your contest"
                        {...field}
                        className="bg-white text-black placeholder-gray-400"
                      />
                    </FormControl>
                    {/* <FormDescription className="text-gray-200">
                      Enter the title for your contest.
                    </FormDescription> */}
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-gray-400",
                              field.value && "text-black"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-gray-400">Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-75 text-gray-600" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-gray-300">
                      This is the expiry date{" "}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <FormLabel className="text-white">Vote Options</FormLabel>
                {[0, 1].map((index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`options.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Type option"
                            {...field}
                            className="bg-white text-black placeholder-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <motion.div
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="mt-8"
                >
                  <Button
                    type="submit"
                    className="w-full bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] transition-colors duration-200"
                  >
                    Create Vote
                  </Button>
                </motion.div>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Add the Dialog component */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vote Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Your vote has been created. Here's the URL:</p>
            <Input
              value={voteUrl}
              readOnly
              className="mt-2"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(voteUrl);
                setIsModalOpen(false);
                router.push(voteUrl);
              }}
            >
              Copy URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
