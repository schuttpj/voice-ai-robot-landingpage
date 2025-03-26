'use client'

import { SplineScene } from "./ui/splite";
import { Card } from "./ui/card"
import { Spotlight } from "./ui/spotlight"
import { GradientButton } from "./ui/gradient-button"
 
export function SplineSceneBasic() {
  // This function allows us to start a voice call
  const startVoiceCall = () => {
    console.log('Starting voice call...');
    // Your existing call logic would go here
  };

  return (
    <Card 
      className="fixed inset-0 w-screen h-screen bg-black/[0.96] overflow-hidden border-0 p-0"
    >
      {/* Full-screen robot container with spotlight */}
      <div className="absolute inset-0 w-full h-full">
        {/* Spotlight component - z-index 10 */}
        <Spotlight
          size={400}
          springOptions={{ 
            bounce: 0,
            damping: 25,
            stiffness: 80,
            mass: 1.2
          }}
        />
        
        {/* Robot/Spline component - z-index 20 */}
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full absolute inset-0 z-20"
        />
      </div>
      
      {/* Text overlay at top left - z-index 30 */}
      <div className="absolute left-0 top-0 w-auto p-6 z-30 pointer-events-none">
        <div className="backdrop-blur-sm bg-black/30 p-4 rounded-xl">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
            Voice AI
          </h1>
          <p className="mt-1 text-neutral-200 max-w-sm text-sm font-light">
            Your intelligent voice assistant powered by advanced AI.
          </p>
        </div>
      </div>
      
      {/* Centered mic button - z-index 40 - with improved placement */}
      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
        {/* Add subtle glow effect to make button appear integrated */}
        <div className="relative">
          {/* Background glow that matches the robot's lighting */}
          <div className="absolute -inset-6 bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent rounded-full blur-xl z-0" />
          
          {/* Subtle animated pulse to simulate robot's light effects */}
          <div className="absolute -inset-4 bg-gradient-radial from-cyan-400/10 via-cyan-400/5 to-transparent rounded-full blur-lg z-0 animate-pulse" style={{ animationDuration: '3s' }} />
          
          <GradientButton 
            size="round" 
            variant="variant"
            className="shadow-xl hover:scale-105 transition-all duration-300 pointer-events-auto relative z-10"
            onClick={startVoiceCall}
            aria-label="Start voice conversation"
          />
        </div>
      </div>
    </Card>
  )
}