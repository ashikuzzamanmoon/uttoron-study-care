'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export interface ChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: any;
  options?: any;
  height?: number;
}

export function AppChart({ type, data, options, height = 300 }: ChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
          color: '#475569',
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 3,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter, sans-serif', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales:
      type !== 'doughnut' && type !== 'pie'
        ? {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 11 } },
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b', font: { size: 11 } },
            },
          }
        : undefined,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height }} className="w-full relative">
      {type === 'line' && <Line data={data} options={mergedOptions} />}
      {type === 'bar' && <Bar data={data} options={mergedOptions} />}
      {type === 'doughnut' && <Doughnut data={data} options={mergedOptions} />}
      {type === 'pie' && <Pie data={data} options={mergedOptions} />}
    </div>
  );
}
