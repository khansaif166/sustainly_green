import { apiOk } from "@/lib/apiResponse";
import { getEditorActor, loadCatalogOptions, loadRichEditor, richApiError, writeRichEditor } from "@/lib/richVendorServer";

export async function GET(request: Request) {
  try {
    const editor = await getEditorActor(request);
    const [profile, catalog] = await Promise.all([loadRichEditor(editor), loadCatalogOptions()]);
    return apiOk({ profile, catalog });
  } catch (error) {
    return richApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const editor = await getEditorActor(request);
    const id = await writeRichEditor(request, editor);
    return apiOk({ id });
  } catch (error) {
    return richApiError(error);
  }
}
