export type WebStoreProductKind = "catalog" | "kibble";

export type WebStoreFulfillmentMethod = "pickup" | "shipping" | "local_delivery";

export type WebStoreVariant = {
  id: string;
  optionValues: Record<string, string>;
  salePriceCents: number;
  stockQuantity: number | null;
};

export type WebStorePersonalizationField = {
  label: string;
  placeholder?: string | null;
  required?: boolean;
  extraPriceCents?: number | null;
  maxLength?: number | null;
};

export type WebStorePersonalizationPhotoField = {
  label: string;
  required?: boolean;
  extraPriceCents?: number | null;
};

export type WebStorePersonalizationQuantityTextGroup = {
  label: string;
  minQuantity: number;
  maxQuantity: number;
  extraPriceCentsPerUnit: number;
  firstUnitIncludedInPrice: boolean;
  textLabelTemplate: string;
  textPlaceholder: string | null;
  maxLength: number | null;
  required: boolean;
};

export type WebStorePersonalization = {
  enabled?: boolean;
  textFields?: WebStorePersonalizationField[];
  photoFields?: WebStorePersonalizationPhotoField[];
  quantityTextGroups?: WebStorePersonalizationQuantityTextGroup[];
  requireAtLeastOneTextOrPhoto?: boolean;
  textAndPhotoExtraPriceCents?: number | null;
} | null;

export type WebStoreProduct = {
  id: string;
  kind: WebStoreProductKind;
  name: string;
  brand?: string;
  variety?: string | null;
  bagKg?: number | null;
  description: string | null;
  photos: { url: string }[];
  salePriceCents: number;
  stockQuantity: number | null;
  productStockQuantity: number | null;
  linkedStockProductId?: string | null;
  linkedStockProductStock?: number | null;
  linkedStockQuantityTextGroupIndex?: number | null;
  linkedStockUnitsPerSale?: number;
  variationAxes: { name: string; values: string[] }[];
  variants: WebStoreVariant[];
  personalization: WebStorePersonalization;
};

export type WebStoreCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: WebStoreProductKind;
  parentId: string | null;
  /** Nombre del padre si aplica (sin componer con la hija). */
  parentName?: string | null;
  products: WebStoreProduct[];
};

export type WebStoreCatalog = {
  categories: WebStoreCategory[];
};

export type WebStoreConfig = {
  deliveryShippingCents: number;
  carriers: string[];
  currency: string;
  redsysConfigured: boolean;
  fulfillmentMethods: WebStoreFulfillmentMethod[];
};

export type WebStoreCartCustomization = {
  texts?: { label: string; value: string }[];
  photos?: { label: string; url: string }[];
  quantityTextGroups?: {
    label: string;
    quantity: number;
    texts: { label: string; value: string }[];
  }[];
} | null;

export type WebStoreCartLine = {
  lineId: string;
  productId: string;
  productKind: WebStoreProductKind;
  name: string;
  optionLabel: string | null;
  imageUrl: string | null;
  /** Precio unitario final (base + personalización). */
  salePriceCents: number;
  /** Suplemento de personalización incluido en salePriceCents. */
  personalizationExtraCents?: number;
  quantity: number;
  variantKey: string | null;
  customization: WebStoreCartCustomization;
  stockQuantity: number | null;
};

export type WebStoreCheckoutResult = {
  paymentId: string;
  storeOrderRef: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  currency: string;
  redsysSessionPath: string;
  createWantAccount: boolean;
};

export type WebStoreRedsysSession = {
  tpvUrl: string;
  fields: {
    Ds_SignatureVersion: string;
    Ds_MerchantParameters: string;
    Ds_Signature: string;
  };
  order: string;
  storeOrderRef: string;
  paymentId: string;
  amountEuro: number;
  amountCents: number;
};

export type WebStoreOrderLookup = {
  storeOrderRef: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  fulfillmentMethod: string;
  paidAt: string | null;
  lines: unknown[];
};

export type WebStoreOrderTrackLine = {
  name: string;
  quantity: number;
  salePriceCents: number;
  optionLabel: string | null;
  imageUrl: string | null;
  isReservation: boolean;
};

export type WebStoreOrderTrack = {
  storeOrderRef: string;
  status: string;
  statusLabel: string;
  fulfillmentMethod: string;
  fulfillmentLabel: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  currency: string;
  carrier: string | null;
  trackingNumber: string | null;
  createdAt: string | null;
  paidAt: string | null;
  lines: WebStoreOrderTrackLine[];
};

export type WebStoreApiError = {
  error: string;
  message?: string;
};
