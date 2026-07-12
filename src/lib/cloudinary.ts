import crypto from "crypto";

// Uploads an image to Cloudinary via their REST API directly (signed upload),
// avoiding an extra SDK dependency for one call. Requires CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.
export async function uploadImageToCloudinary(fileBuffer: Buffer, mimeType: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || cloudName === "your-cloudinary-cloud-name") {
    throw new Error(
      "Photo upload isn't configured yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env (see README), or paste a photo URL instead."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "dock9-pallets";
  // Cloudinary signature = sha1("param1=value1&param2=value2..." + api_secret), params sorted alphabetically,
  // including only the params sent to the API besides file/api_key/signature/resource_type.
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  const form = new FormData();
  form.append("file", dataUri);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}
