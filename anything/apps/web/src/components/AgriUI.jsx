import React from "react";
import { motion } from "motion/react";

export const Card = ({ children, title, icon: Icon, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl ${className}`}
  >
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20">
          <Icon size={20} />
        </div>
      )}
      <h3 className="text-xl font-bold tracking-tight text-white/90">
        {title}
      </h3>
    </div>
    {children}
  </motion.div>
);

export const SensorCard = ({
  label,
  value,
  unit,
  icon: Icon,
  color = "green",
}) => {
  const colorMap = {
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -4 }}
      className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between shadow-lg"
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-3xl font-black text-white">{value}</span>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
              {unit}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
