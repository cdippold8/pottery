"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { addProductImage, deleteProductImage } from "@/app/actions/products";

type ProductImage = { id: string; url: string };

export default function ProductImages({
  productId,
  images,
  isAdmin,
  productName,
}: {
  productId: string;
  images: ProductImage[];
  isAdmin: boolean;
  productName: string;
}) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      await addProductImage(productId, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      await deleteProductImage(imageId);
      setFullscreenIndex(null);
    });
  }

  const [hero, ...rest] = images;

  return (
    <div className="flex flex-col gap-2">
      {hero && (
        <div className="group relative aspect-square w-full overflow-hidden rounded-lg border border-border sm:aspect-[4/3]">
          <button
            type="button"
            onClick={() => setFullscreenIndex(0)}
            className="absolute inset-0"
            aria-label="View image 1 full screen"
          >
            <Image
              src={hero.url}
              alt={`${productName} photo 1`}
              fill
              sizes="(min-width: 640px) 60vw, 100vw"
              priority
              className="object-cover"
            />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleDelete(hero.id)}
              disabled={isPending}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white transition sm:opacity-0 sm:group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {rest.map((image, i) => {
            const index = i + 1;
            return (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setFullscreenIndex(index)}
                  className="absolute inset-0"
                  aria-label={`View image ${index + 1} full screen`}
                >
                  <Image
                    src={image.url}
                    alt={`${productName} photo ${index + 1}`}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(image.id)}
                    disabled={isPending}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white transition sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <label className="w-fit cursor-pointer text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
          {isPending ? "Uploading..." : "+ Upload image"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isPending}
          />
        </label>
      )}

      {fullscreenIndex !== null && images[fullscreenIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 text-2xl text-white"
            onClick={() => setFullscreenIndex(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="relative h-full w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[fullscreenIndex].url}
              alt={`${productName} full screen photo`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
