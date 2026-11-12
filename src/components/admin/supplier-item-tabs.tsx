"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import styles from "./supplier-item-detail.module.css";

export function SupplierItemTabs({
  summary,
  pricing,
  linking,
}: {
  summary: ReactNode;
  pricing: ReactNode;
  linking: ReactNode;
}) {
  return (
    <Tabs defaultValue="summary" className={styles.tabs}>
      <TabsList variant="line" aria-label="Detalle del artículo" className={styles.tabList}>
        <TabsTrigger value="summary">Resumen</TabsTrigger>
        <TabsTrigger value="pricing">Precios</TabsTrigger>
        <TabsTrigger value="linking">Vinculación</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" keepMounted>
        {summary}
      </TabsContent>
      <TabsContent value="pricing" keepMounted>
        {pricing}
      </TabsContent>
      <TabsContent value="linking" keepMounted>
        {linking}
      </TabsContent>
    </Tabs>
  );
}
