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

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  deadline: z.date({
    required_error: "A deadline is required.",
  }),
  options: z.array(z.string()).min(2).max(4),
});

export function CreateContestForm() {
  const router = useRouter();
  const [options, setOptions] = useState(["Yes", "No"]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Keep the animation running continuously
    setIsAnimating(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      options: ["Yes", "No"],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/votes", {
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
        router.push(`/contests/${data.voteId}`);
      }, 3000);
    } catch (error) {
      console.error("Error creating vote:", error);
      // TODO: Show error message to user
    }
  }

  const handleAddOption = () => {
    if (options.length < 4) {
      const currentOptions = form.getValues().options || [];
      const newOptions = [...currentOptions, ""];
      setOptions(newOptions);
      form.setValue("options", newOptions);
    }
  };

  const handleDeleteOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      form.setValue("options", newOptions);
    }
  };

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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                <FormLabel className="text-white">
                  Choose Vote Options
                </FormLabel>
                {options.map((option, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`options.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2 mt-2">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              {...field}
                              className="flex-grow bg-white text-black"
                            />
                            {options.length > 2 && (
                              <motion.div
                                variants={buttonVariants}
                                initial="rest"
                                whileHover="hover"
                                whileTap="tap"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOption(index)}
                                  className="flex-shrink-0 bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                {options.length < 4 && (
                  <motion.div
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="button"
                      onClick={handleAddOption}
                      className="bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                      Add Option
                    </Button>
                  </motion.div>
                )}
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
    </div>
  );
}
