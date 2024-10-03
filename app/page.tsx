"use client";

import { CreateContestForm } from "@/app/components/create-contest-form";
import { useEffect, useRef } from "react";

export default function CreateContestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 100;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * (canvas?.width ?? 0);
        this.y = Math.random() * (canvas?.height ?? 0);
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(20, 241, 149, 0.5)"; // Updated color
        ctx.strokeStyle = "rgba(20, 241, 149, 0.5)"; // Updated color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    function handleParticles() {
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].size <= 0.2) {
          particles.splice(i, 1);
          i--;
        }
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      handleParticles();
      if (particles.length < particleCount) {
        particles.push(new Particle());
      }
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1A1A1A] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Create a Voting Frame on Warpcast
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-2xl">
            Design and launch your custom voting frame for the Warpcast
            community
          </p>
        </div>
        <div className="">
          <CreateContestForm />
        </div>
      </div>
    </div>
  );
}
