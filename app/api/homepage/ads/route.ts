import { apiOk } from "@/lib/apiResponse";
import { supabaseServiceFetch } from "@/lib/supabaseServer";

type BannerSetting = {
  value?: { imageUrl?: string; linkUrl?: string; active?: boolean };
};

type AdProduct = {
  id: string;
  title: string;
  product_images?: Array<{ url: string; sort_order: number | null }>;
};

export async function GET() {
  try {
    const [bannerRows, productRows] = await Promise.all([
      supabaseServiceFetch<BannerSetting[]>(
        "/rest/v1/site_settings?select=value&key=eq.homepageBanner&limit=1",
      ),
      supabaseServiceFetch<AdProduct[]>(
        "/rest/v1/products?select=id,title,product_images(url,sort_order)&is_ad=eq.true&ad_status=eq.APPROVED&ad_active=eq.true&order=created_at.desc&limit=8",
      ),
    ]);

    const slides: Array<{ id: string; title: string; imageUrl: string; linkUrl: string }> = [];
    const banner = bannerRows[0]?.value;
    if (banner?.active !== false && banner?.imageUrl) {
      slides.push({
        id: "homepage-banner",
        title: "Sustainly Green featured banner",
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "/browse",
      });
    }

    for (const product of productRows) {
      const imageUrl = [...(product.product_images || [])]
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.url;
      if (imageUrl) {
        slides.push({
          id: product.id,
          title: product.title,
          imageUrl,
          linkUrl: `/products/${product.id}`,
        });
      }
    }

    return apiOk({ ok: true, slides });
  } catch (error) {
    console.error("PUBLIC_HOMEPAGE_ADS_ERROR", error);
    return apiOk({ ok: true, slides: [] });
  }
}
