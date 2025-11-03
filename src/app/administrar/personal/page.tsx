'use client'

import Navbar from "@/components/ui/Navbar";
import SectionTitle from "@/components/ui/SectionTitle";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EmpleadosTable from "@/components/servicios/EmpleadosTable";

export default function EmpleadosPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
            <SectionTitle>Personal de la empresa</SectionTitle>
            <button
                onClick={() => router.push('/administrar')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Regresar al panel
            </button>
        </div>
        <EmpleadosTable />
      </main>
    </>
  );
}
