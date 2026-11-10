import { getProductImport, postProductImport } from "@/lib/productImportServer";

export const GET = (request: Request) => getProductImport(request, "vendor");
export const POST = (request: Request) => postProductImport(request, "vendor");
