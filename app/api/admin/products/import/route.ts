import { getProductImport, postProductImport } from "@/lib/productImportServer";

export const GET = (request: Request) => getProductImport(request, "admin");
export const POST = (request: Request) => postProductImport(request, "admin");
