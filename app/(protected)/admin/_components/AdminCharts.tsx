"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DONUT_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444"];

type CountDatum = {
  name: string;
  count: number;
};

type CategoryDatum = {
  name: string;
  value: number;
};

export default function AdminCharts({
  barData,
  productsByCategory,
}: {
  barData: CountDatum[];
  productsByCategory: CategoryDatum[];
}) {
  return (
    <div className="ad-charts">
      <div className="ad-card">
        <div className="ad-card-head">
          <p className="ad-card-title">Platform Overview</p>
          <p className="ad-card-sub">All-time counts</p>
        </div>
        <div className="ad-card-body" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "rgba(22,163,74,.06)" }} />
              <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ad-card">
        <div className="ad-card-head">
          <p className="ad-card-title">By Category</p>
          <p className="ad-card-sub">Product distribution</p>
        </div>
        <div className="ad-card-body" style={{ height: 260 }}>
          {productsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productsByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {productsByCategory.map((_, index) => <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No product data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
