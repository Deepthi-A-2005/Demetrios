"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Leaf,
  Droplets,
  Thermometer,
  Wind,
  Target,
  Navigation,
  Camera,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  Activity,
  History,
  Settings,
  Map as MapIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SensorCard, Card } from "../components/AgriUI";

export default function AgriDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Queries
  const { data: sensorData, isLoading: sensorsLoading } = useQuery({
    queryKey: ["sensors"],
    queryFn: () => fetch("/api/sensors").then((res) => res.json()),
    refetchInterval: 3000,
  });

  const { data: roverState, isLoading: roverLoading } = useQuery({
    queryKey: ["rover"],
    queryFn: () => fetch("/api/rover").then((res) => res.json()),
    refetchInterval: 1000,
  });

  const { data: analyses } = useQuery({
    queryKey: ["analysis"],
    queryFn: () => fetch("/api/analysis").then((res) => res.json()),
  });

  // Mutations
  const updateRover = useMutation({
    mutationFn: (updates) =>
      fetch("/api/rover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((res) => res.json()),
    onSuccess: () => queryClient.invalidateQueries(["rover"]),
  });

  const latest = sensorData?.latest || {
    moisture: 45,
    temperature: 24.5,
    humidity: 62,
    ph: 6.8,
    ultrasonic: 120,
    latitude: 0,
    longitude: 0,
  };

  const controlRover = (command) => {
    updateRover.mutate({ command });
  };

  const toggleWatering = () => {
    updateRover.mutate({ is_watering: !roverState?.is_watering });
  };

  return (
    <div
      className={`min-h-screen bg-[#050505] text-white font-sans selection:bg-green-500/30 transition-colors duration-1000 ${roverState?.is_watering ? "shadow-[inset_0_0_100px_rgba(59,130,246,0.1)]" : ""}`}
    >
      {/* Sidebar / Nav */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-black/40 border-r border-white/5 flex flex-col items-center py-8 z-50">
        <div className="mb-12">
          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <Leaf className="text-white" size={24} />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          {[
            { id: "dashboard", icon: Activity },
            { id: "controls", icon: Navigation },
            { id: "camera", icon: Camera },
            { id: "history", icon: History },
            { id: "settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                activeTab === item.id
                  ? "bg-green-500/20 text-green-500"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              AgriRover <span className="text-green-500">v2.0</span>
            </h1>
            <p className="text-white/50">
              Real-time autonomous farm monitoring & analysis
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${sensorsLoading ? "bg-orange-500 animate-pulse" : "bg-green-500"}`}
              />
              <span className="text-xs font-medium uppercase tracking-widest text-white/70">
                {sensorsLoading ? "Connecting..." : "Rover Online"}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Dashboard View */}
          {activeTab === "dashboard" && (
            <>
              {/* Sensor Grid */}
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                <SensorCard
                  label="Soil Moisture"
                  value={latest.moisture}
                  unit="%"
                  icon={Droplets}
                  color="blue"
                />
                <SensorCard
                  label="Temperature"
                  value={latest.temperature}
                  unit="°C"
                  icon={Thermometer}
                  color="orange"
                />
                <SensorCard
                  label="Humidity"
                  value={latest.humidity}
                  unit="%"
                  icon={Wind}
                  color="green"
                />
                <SensorCard
                  label="Soil pH"
                  value={latest.ph}
                  unit="pH"
                  icon={Leaf}
                  color="orange"
                />
              </div>

              {/* Live Analytics */}
              <Card
                title="Live Metrics History"
                icon={Activity}
                className="col-span-12 lg:col-span-8 h-[400px]"
              >
                <div className="h-full w-full pr-4">
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={sensorData?.history || []}>
                      <defs>
                        <linearGradient
                          id="colorMoisture"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="#ffffff40" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #ffffff10",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="moisture"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorMoisture)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#f97316"
                        fillOpacity={0}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Status & Alerts */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <Card title="Rover Status" icon={Navigation}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-white/60">
                        Current Action
                      </span>
                      <span className="text-sm font-bold text-green-400">
                        {roverState?.command}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-white/60">
                        Irrigation System
                      </span>
                      <span
                        className={`text-sm font-bold ${roverState?.is_watering ? "text-blue-400" : "text-white/40"}`}
                      >
                        {roverState?.is_watering ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm text-white/60">
                        Obstacle Distance
                      </span>
                      <span className="text-sm font-bold text-white">
                        {latest.ultrasonic} cm
                      </span>
                    </div>
                  </div>
                </Card>

                <Card
                  title="Latest Analysis"
                  icon={Target}
                  className="bg-gradient-to-br from-green-500/10 to-transparent"
                >
                  {analyses?.[0] ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={analyses[0].image_url}
                          alt="Crop"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 rounded text-[10px] font-bold uppercase">
                          {analyses[0].health_status}
                        </div>
                      </div>
                      <p className="text-xs text-white/60 italic">
                        "{analyses[0].recommendation}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-white/20">
                      <Camera size={32} className="mb-2" />
                      <span className="text-xs">No analysis yet</span>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}

          {/* Controls View */}
          {activeTab === "controls" && (
            <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card
                title="Remote Navigation"
                icon={Navigation}
                className="aspect-square flex flex-col items-center justify-center"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div />
                  <ControlBtn
                    icon={ArrowUp}
                    onClick={() => controlRover("FORWARD")}
                    active={roverState?.command === "FORWARD"}
                  />
                  <div />
                  <ControlBtn
                    icon={ArrowLeft}
                    onClick={() => controlRover("LEFT")}
                    active={roverState?.command === "LEFT"}
                  />
                  <ControlBtn
                    icon={Square}
                    onClick={() => controlRover("STOP")}
                    variant="stop"
                    active={roverState?.command === "STOP"}
                  />
                  <ControlBtn
                    icon={ArrowRight}
                    onClick={() => controlRover("RIGHT")}
                    active={roverState?.command === "RIGHT"}
                  />
                  <div />
                  <ControlBtn
                    icon={ArrowDown}
                    onClick={() => controlRover("BACKWARD")}
                    active={roverState?.command === "BACKWARD"}
                  />
                  <div />
                </div>
                <div className="mt-12 flex gap-4 w-full px-8">
                  <button
                    onClick={toggleWatering}
                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      roverState?.is_watering
                        ? "bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <Droplets size={20} />
                    {roverState?.is_watering ? "Watering..." : "Start Watering"}
                  </button>
                </div>
              </Card>

              <Card
                title="Live GPS Positioning"
                icon={MapIcon}
                className="aspect-square relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
                  <div className="text-center">
                    <Navigation
                      className="text-green-500 mb-4 mx-auto animate-pulse"
                      size={48}
                    />
                    <p className="text-white/40 text-sm">
                      Real-time GPS Tracking
                    </p>
                    <div className="mt-4 font-mono text-xs text-green-500/60">
                      LAT: {latest.latitude.toFixed(6)}
                      <br />
                      LNG: {latest.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
                {/* Simulated Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none border border-white/5 grid grid-cols-10 grid-rows-10">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-white/5" />
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Camera / History View */}
          {(activeTab === "camera" || activeTab === "history") && (
            <div className="col-span-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyses?.map((item) => (
                  <Card
                    key={item.id}
                    title={new Date(item.timestamp).toLocaleString()}
                    className="overflow-hidden p-0"
                  >
                    <img
                      src={item.image_url}
                      alt="Capture"
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-4 bg-black/40">
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.health_status === "Good"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {item.health_status}
                        </span>
                        <span className="text-[10px] text-white/40">
                          ID: #{item.id}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
      `}</style>
    </div>
  );
}

function ControlBtn({ icon: Icon, onClick, active, variant = "default" }) {
  const baseStyles =
    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 border";
  const variants = {
    default: active
      ? "bg-green-500 text-white border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
      : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white",
    stop: active
      ? "bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
      : "bg-white/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
      <Icon size={24} strokeWidth={active ? 3 : 2} />
    </button>
  );
}
