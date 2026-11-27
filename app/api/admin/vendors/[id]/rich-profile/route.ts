import { apiOk } from "@/lib/apiResponse";
import { getEditorActor, loadCatalogOptions, loadRichEditor, richApiError, writeRichEditor } from "@/lib/richVendorServer";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const editor = await getEditorActor(request, (await params).id);
    const catalogRequest = loadCatalogOptions();
    const [profile, catalog] = await Promise.all([loadRichEditor(editor, catalogRequest), catalogRequest]);
    return apiOk({ profile, catalog });
  } catch (error) {
    return richApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const editor = await getEditorActor(request, (await params).id);
    const id = await writeRichEditor(request, editor);
    return apiOk({ id });
  } catch (error) {
    return richApiError(error);
  }
}
