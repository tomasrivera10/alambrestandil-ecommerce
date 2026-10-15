import { requireArea } from "@/server/rbac";
import { prisma } from "@/server/db";
import workbookRows from "@/data/stock-workbook.json";
import { StockAnalysis } from "@/components/admin/stock-analysis";

export const dynamic = "force-dynamic";

export default async function StockAnalysisPage() {
  await requireArea("products");
  const variants = await prisma.productVariant.findMany({
    where: { active: true },
    select: {
      id: true,
      productId: true,
      name: true,
      sku: true,
      sourceReference: true,
      price: true,
      product: { select: { name: true, price: true, category: { select: { name: true } } } },
      inventory: { select: { onHand: true, reserved: true } },
      supplierItems: { where: { purchased: true }, select: { listPrice: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
  });
  const matched = new Set<number>();
  const rows = variants.map((variant) => {
    const sourceRow = /Stock!A(\d+):B\d+/.exec(variant.sourceReference ?? "");
    const reference = workbookRows.find((row) => row.row === Number(sourceRow?.[1]));
    if (reference) matched.add(reference.row);
    const costs = variant.supplierItems
      .map((item) => Number(item.listPrice))
      .filter((cost) => Number.isFinite(cost) && cost > 0);
    const livePrice = variant.price ?? variant.product.price;
    return {
      id: variant.id,
      productId: variant.productId,
      name: variant.name,
      product: variant.product.name,
      category: variant.product.category.name,
      sku: variant.sku,
      unit: reference?.unit ?? "",
      sourceRow: reference?.row ?? null,
      listPrice: costs.length === 1 ? costs[0] : (reference?.list ?? null),
      referenceList: reference?.list ?? null,
      listSource: costs.length === 1 ? "Proveedor" : reference ? "Excel" : "Sin costo",
      discountedReference: reference?.discounted ?? null,
      discountFormula: reference?.discountFormula ?? false,
      finalPrice: livePrice == null ? (reference?.final ?? null) : Number(livePrice),
      priceSource: livePrice == null ? (reference ? "Excel" : "Sin precio") : "Catálogo",
      stock:
        variant.inventory == null ? (reference?.stock ?? null) : Number(variant.inventory.onHand),
      reserved: variant.inventory == null ? 0 : Number(variant.inventory.reserved),
      stockSource: variant.inventory == null ? (reference ? "Excel" : "Sin stock") : "Inventario",
    };
  });
  for (const reference of workbookRows) {
    if (matched.has(reference.row)) continue;
    rows.push({
      id: `excel-${reference.row}`,
      productId: "",
      name: reference.name,
      product: reference.name,
      category: reference.category,
      sku: `Excel-${reference.row}`,
      unit: reference.unit,
      sourceRow: reference.row,
      listPrice: reference.list,
      referenceList: reference.list,
      listSource: "Excel",
      discountedReference: reference.discounted,
      discountFormula: reference.discountFormula,
      finalPrice: reference.final,
      priceSource: "Excel",
      stock: reference.stock,
      reserved: 0,
      stockSource: "Excel",
    });
  }
  return <StockAnalysis rows={rows} referenceCount={workbookRows.length} />;
}
