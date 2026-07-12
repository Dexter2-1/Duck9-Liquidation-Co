"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Template = { id: string; name: string; body: string };
type HistoryItem = { id: string; body: string; editedBy: string; createdAt: string };

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pallet, setPallet] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copyFromSku, setCopyFromSku] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [csvText, setCsvText] = useState("");
  const [manifestMessage, setManifestMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [priceForm, setPriceForm] = useState({ price: "", compareAtPrice: "", floorPrice: "" });
  const editorRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    setPallet(data);
    setDescription(data.description || "");
    setImageUrl(data.imageUrl || "");
    setGalleryText(data.imagesJson ? JSON.parse(data.imagesJson).join("\n") : "");
    setPriceForm({ price: String(data.price ?? ""), compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : "", floorPrice: String(data.floorPrice ?? "") });
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    // seed templates client-side call to a lightweight endpoint substitute:
    // (templates are seeded in DB; for simplicity we fetch all products' descriptions is overkill,
    // so we keep a small static mirror here matching prisma/seed.ts)
    setTemplates([
      { id: "t1", name: "Electronics Template", body: "This pallet contains a mixed lot of electronics and small appliances. Items are customer returns and may include units that are like-new, lightly used, or non-functional. Testing is recommended before resale. Retail value is estimated from manifested MSRP." },
      { id: "t2", name: "Furniture Template", body: "This pallet contains furniture and home goods pulled from retail overstock. Expect assembled and flat-pack items; boxes may show shelf wear. Ideal for resale to local buyers due to freight size." },
      { id: "t3", name: "General Merchandise Template", body: "This is a mixed general merchandise pallet sourced from customer returns and shelf pulls. Category mix varies by load. Item count and condition reflect the attached manifest." },
    ]);
  }, []);

  if (!pallet) return <div>Loading…</div>;

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  async function saveDescription() {
    await fetch(`/api/products/${id}/description`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    load();
  }

  async function saveCondition(condition: string) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition }),
    });
    load();
  }

  async function saveImages() {
    const imagesJson = JSON.stringify(galleryText.split("\n").map((s) => s.trim()).filter(Boolean));
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imageUrl || null, imagesJson }),
    });
    load();
  }

  async function savePricing() {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: parseFloat(priceForm.price),
        compareAtPrice: priceForm.compareAtPrice ? parseFloat(priceForm.compareAtPrice) : null,
        floorPrice: parseFloat(priceForm.floorPrice),
      }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Could not save pricing.");
    load();
  }

  async function generateAI() {
    setAiLoading(true);
    setAiError("");
    const res = await fetch(`/api/products/${id}/description/generate`, { method: "POST" });
    const data = await res.json();
    setAiLoading(false);
    if (res.ok) {
      setDescription(data.description);
    } else {
      setAiError(data.error);
    }
  }

  async function copyFrom() {
    const res = await fetch("/api/products");
    const all = await res.json();
    const source = all.find((p: any) => p.sku.toLowerCase() === copyFromSku.trim().toLowerCase());
    if (source) {
      const full = await fetch(`/api/products/${source.id}`).then((r) => r.json());
      setDescription(full.description || "");
    }
  }

  async function uploadManifest() {
    const res = await fetch("/api/manifest/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palletId: id, csvText }),
    });
    const data = await res.json();
    setManifestMessage(res.ok ? `Uploaded ${data.rowCount} manifest rows.` : data.error);
    load();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setImageUrl(data.url);
    } else {
      setUploadError(data.error);
    }
    e.target.value = "";
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">{pallet.title}</h1>
      <div className="text-sm text-gray-500 font-mono mb-6">LOAD #{pallet.sku}</div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Photos</h2>
        <label className="block text-xs font-semibold uppercase mb-1">Upload a photo from your device</label>
        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="text-sm mb-1" />
        {uploading && <p className="text-xs text-gray-500 mb-2">Uploading…</p>}
        {uploadError && <p className="text-xs text-red-600 mb-2">{uploadError}</p>}
        <p className="text-xs text-gray-500 mb-3">Or paste a photo URL below if you've already hosted one elsewhere.</p>
        <label className="block text-xs font-semibold uppercase mb-1">Main photo URL (shown on the storefront card)</label>
        <input className="input mb-3" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full max-w-xs h-40 object-cover rounded mb-3 border border-gray-200" />
        )}
        <label className="block text-xs font-semibold uppercase mb-1">Additional photos (one URL per line, shown in the detail gallery)</label>
        <textarea
          className="input min-h-[80px] mb-3"
          placeholder={"https://example.com/photo2.jpg\nhttps://example.com/photo3.jpg"}
          value={galleryText}
          onChange={(e) => setGalleryText(e.target.value)}
        />
        <button className="btn btn-primary" onClick={saveImages}>Save photos</button>
        <p className="text-xs text-gray-500 mt-2">Uploaded photos are hosted on Cloudinary once configured (see README). Until then, uploads will show a setup error — paste a URL as a fallback.</p>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Pricing</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Listed price</label>
            <input className="input" value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Was price (Sale badge)</label>
            <input className="input" placeholder="Leave blank if not on sale" value={priceForm.compareAtPrice} onChange={(e) => setPriceForm({ ...priceForm, compareAtPrice: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Floor price (min)</label>
            <input className="input" value={priceForm.floorPrice} onChange={(e) => setPriceForm({ ...priceForm, floorPrice: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={savePricing}>Save pricing</button>
        <p className="text-xs text-gray-500 mt-2">Setting a "Was price" higher than the listed price shows a Sale badge and strikethrough on the storefront. Bulk/single edits can never go below the floor price.</p>
      </div>

      <div className="card p-5 mb-6">
        <label className="block text-xs font-semibold uppercase mb-1">Condition</label>
        <select className="input w-64" value={pallet.condition} onChange={(e) => saveCondition(e.target.value)}>
          <option value="LIKE_NEW">Like New</option>
          <option value="MINOR_SCRATCHES">Minor Scratches</option>
          <option value="HEAVY_WEAR">Heavy Wear</option>
          <option value="AS_IS">As-Is</option>
        </select>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Description</h2>
          <span className={`text-xs ${wordCount < 300 ? "text-orange-600" : "text-green-700"}`}>
            {wordCount} words {wordCount < 300 ? "(300+ tends to sell better)" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <select
            className="input w-auto text-xs"
            onChange={(e) => {
              const t = templates.find((t) => t.id === e.target.value);
              if (t) setDescription(t.body);
            }}
            defaultValue=""
          >
            <option value="" disabled>Insert template…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <input className="input w-auto text-xs" placeholder="Copy from SKU…" value={copyFromSku} onChange={(e) => setCopyFromSku(e.target.value)} />
          <button className="btn btn-outline text-xs" onClick={copyFrom}>Copy</button>

          <button className="btn btn-outline text-xs" onClick={generateAI} disabled={aiLoading}>
            {aiLoading ? "Generating…" : "✨ AI Auto-Writer"}
          </button>
          <button className="btn btn-outline text-xs" onClick={() => setShowPreview(true)}>Preview</button>
        </div>

        {aiError && <div className="text-xs text-red-600 mb-2">{aiError}</div>}

        <textarea
          ref={editorRef as any}
          className="input min-h-[200px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="btn btn-primary mt-3" onClick={saveDescription}>Save description</button>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Edit history</h2>
        {pallet.descHistory?.length ? (
          <ul className="space-y-2 text-sm">
            {pallet.descHistory.map((h: HistoryItem) => (
              <li key={h.id} className="border-b border-gray-100 pb-2">
                <div className="text-xs text-gray-500 mb-1">{h.editedBy} · {new Date(h.createdAt).toLocaleString()}</div>
                <div className="flex justify-between items-start gap-3">
                  <span className="text-gray-700 line-clamp-2">{h.body.slice(0, 120)}{h.body.length > 120 ? "…" : ""}</span>
                  <button className="text-xs underline shrink-0" onClick={() => setDescription(h.body)}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No edits yet.</p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-bold mb-3">Manifest</h2>
        {pallet.manifestJson ? (
          <p className="text-sm text-green-700 mb-3">Manifest on file ({JSON.parse(pallet.manifestJson).length} line items).</p>
        ) : (
          <p className="text-sm text-gray-500 mb-3">No manifest uploaded yet.</p>
        )}
        <textarea
          className="input min-h-[100px] font-mono text-xs mb-2"
          placeholder={"item_name,quantity,unit_retail_price\nCordless Drill,4,89.99\nToaster Oven,10,45.00"}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <button className="btn btn-outline text-xs" onClick={uploadManifest}>Upload manifest CSV</button>
        {manifestMessage && <span className="text-xs text-gray-600 ml-3">{manifestMessage}</span>}
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-md p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs uppercase text-gray-400 mb-2">Customer-facing preview</div>
            <h3 className="text-xl font-bold mb-2">{pallet.title}</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{description || "No description yet."}</p>
            <button className="btn btn-outline mt-4 text-xs" onClick={() => setShowPreview(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
