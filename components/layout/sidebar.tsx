"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r min-h-screen p-6">
      <h1 className="text-2xl font-bold">
        LearnSphere AI
      </h1>

      <div className="mt-6 space-y-2">
        <Link href="/dashboard/dashboard">
          Dashboard
        </Link>
      </div>
    </aside>
  );
}