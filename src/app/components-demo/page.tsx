"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function ComponentsDemo() {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Fortnite-Style Components
          </h1>
          <p className="text-gray-300 text-lg">
            Gaming UI components inspired by Fortnite interface design
          </p>
        </div>

        {/* Buttons Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-500/30 pb-3">
            🎮 Buttons
          </h2>

          <div className="grid gap-8">
            {/* Button Variants */}
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-4">
                Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default Blue</Button>
                <Button variant="default">Primary Orange</Button>
                <Button variant="secondary">Success Green</Button>
                <Button variant="destructive">Destructive Red</Button>
                <Button variant="secondary">Secondary Purple</Button>
                <Button variant="outline">Outline Style</Button>
                <Button variant="ghost">Ghost Style</Button>
                <Button variant="link">Link Style</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-4">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="default">
                  Small
                </Button>
                <Button size="default" variant="default">
                  Default
                </Button>
                <Button size="lg" variant="default">
                  Large
                </Button>
                <Button size="lg" variant="default">
                  Extra Large
                </Button>
              </div>
            </div>

            {/* Gaming Action Buttons */}
            <div>
              <h3 className="text-xl font-semibold text-blue-400 mb-4">
                Gaming Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default" size="lg">
                  🎯 Start Match
                </Button>
                <Button variant="secondary" size="default">
                  ✅ Ready Up
                </Button>
                <Button variant="destructive" size="default">
                  💥 Eliminate
                </Button>
                <Button variant="secondary" size="default">
                  ⚙️ Settings
                </Button>
                <Button variant="outline" size="default">
                  📊 Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-500/30 pb-3">
            ⌨️ Input Fields
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="demo-username"
                  className="block text-blue-400 font-semibold mb-2"
                >
                  Username
                </label>
                <Input
                  id="demo-username"
                  type="text"
                  placeholder="Enter your gamer tag..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="demo-email"
                  className="block text-purple-400 font-semibold mb-2"
                >
                  Email
                </label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="your.email@gaming.com"
                  data-type="email"
                />
              </div>

              <div>
                <label
                  htmlFor="demo-password"
                  className="block text-orange-400 font-semibold mb-2"
                >
                  Password
                </label>
                <Input
                  id="demo-password"
                  type="password"
                  placeholder="Enter secure password..."
                  data-type="password"
                />
              </div>

              <div>
                <label
                  htmlFor="demo-battle-code"
                  className="block text-green-400 font-semibold mb-2"
                >
                  Battle Code
                </label>
                <Input
                  id="demo-battle-code"
                  type="text"
                  placeholder="BATTLE-CODE-2024"
                  className="font-mono uppercase tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="demo-file-upload"
                  className="block text-blue-400 font-semibold mb-2"
                >
                  File Upload
                </label>
                <Input id="demo-file-upload" type="file" accept=".jpg,.png,.gif" />
              </div>

              <div>
                <label
                  htmlFor="demo-invalid-input"
                  className="block text-red-400 font-semibold mb-2"
                >
                  Invalid Input Example
                </label>
                <Input
                  id="demo-invalid-input"
                  type="text"
                  placeholder="This field has an error..."
                  aria-invalid="true"
                />
              </div>

              <div>
                <label
                  htmlFor="demo-disabled-input"
                  className="block text-gray-400 font-semibold mb-2"
                >
                  Disabled Input
                </label>
                <Input
                  id="demo-disabled-input"
                  type="text"
                  placeholder="This field is disabled..."
                  disabled
                />
              </div>

              <div>
                <label
                  htmlFor="demo-search-players"
                  className="block text-cyan-400 font-semibold mb-2"
                >
                  Search Players
                </label>
                <Input
                  id="demo-search-players"
                  type="search"
                  placeholder="🔍 Search for players..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Textarea Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-500/30 pb-3">
            📝 Text Areas
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label
                htmlFor="demo-battle-strategy"
                className="block text-blue-400 font-semibold mb-2"
              >
                Battle Strategy
              </label>
              <Textarea
                id="demo-battle-strategy"
                placeholder="Describe your battle strategy for the team..."
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                rows={6}
              />
            </div>

            <div>
              <label
                htmlFor="demo-squad-communication"
                className="block text-purple-400 font-semibold mb-2"
              >
                Squad Communication
              </label>
              <Textarea
                id="demo-squad-communication"
                placeholder="Enter squad communication notes..."
                rows={6}
              />
            </div>

            <div>
              <label
                htmlFor="demo-error-textarea"
                className="block text-red-400 font-semibold mb-2"
              >
                Error State Textarea
              </label>
              <Textarea
                id="demo-error-textarea"
                placeholder="This textarea has an error..."
                aria-invalid="true"
                rows={4}
              />
            </div>

            <div>
              <label
                htmlFor="demo-disabled-textarea"
                className="block text-gray-400 font-semibold mb-2"
              >
                Disabled Textarea
              </label>
              <Textarea
                id="demo-disabled-textarea"
                placeholder="This textarea is disabled..."
                disabled
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-500/30 pb-3">
            🎯 Interactive Demo
          </h2>

          <div className="bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-blue-400 mb-6">
              Join Battle Royale
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <Input type="text" placeholder="Player Name" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  data-type="email"
                />
                <Input type="text" placeholder="Squad Name (Optional)" />
              </div>

              <div>
                <Textarea
                  placeholder="Tell us about your gaming experience and preferred playstyle..."
                  rows={6}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="default" size="lg">
                🚀 Join Battle
              </Button>
              <Button variant="outline" size="lg">
                👥 Find Squad
              </Button>
              <Button variant="secondary" size="lg">
                ⚙️ Settings
              </Button>
            </div>
          </div>
        </section>

        {/* Component Features */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-500/30 pb-3">
            ✨ Component Features
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3">
                🎨 Visual Effects
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Gradient backgrounds</li>
                <li>• Glowing borders</li>
                <li>• Shimmer animations</li>
                <li>• Active scale effects</li>
                <li>• Backdrop blur</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-3">
                🎮 Gaming UX
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Bold, uppercase text</li>
                <li>• High contrast colors</li>
                <li>• Tactile feedback</li>
                <li>• Clear state indicators</li>
                <li>• Accessibility support</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-3">
                ⚡ Performance
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Smooth transitions</li>
                <li>• Optimized animations</li>
                <li>• Responsive design</li>
                <li>• TypeScript support</li>
                <li>• Tree-shakeable</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
