import {
  reactExtension,
  BlockStack,
  Text,
  useApi,
  InlineLayout,
  useCartLines,
  useApplyCartLinesChange,
  SkeletonImage,
  SkeletonTextBlock,
  Image,
  View,
  Button,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

const SITE_ID = 'a6kz84';
const PROFILE_TAG = 'checkout-upsell';
const LIMIT = 4;

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query } = useApi();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    loadUpsells();
  }, [cartLines]);

  async function loadUpsells() {
    setIsLoading(true);
    const cartSkus = cartLines.map((line) => line.merchandise?.sku).filter(Boolean).join(',');
    const cartVariantIds = new Set(cartLines.map((line) => line.merchandise?.id).filter(Boolean));

    try {
      const fetched = await fetchUpsells(cartSkus, cartVariantIds);
      setProducts(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUpsells(cartSkus, cartVariantIds = new Set()) {
    const url =
      `https://${SITE_ID}.a.searchspring.io/boost/${SITE_ID}/recommend` +
      `?tags=${PROFILE_TAG}&cart=${encodeURIComponent(cartSkus)}&limits=${LIMIT}&beacon=true`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const rawProducts = data[0]?.results ?? [];

    const resolved = await Promise.all(
      rawProducts.map(async (item) => {
        const handle = item.attributes?.handle || extractHandle(item.mappings?.core?.url);
        if (!handle) return null;

        const gqlResult = await query(
          `query GetProduct($handle: String!) {
            product(handle: $handle) {
              title
              featuredImage { url altText }
              priceRange { minVariantPrice { amount currencyCode } }
              variants(first: 1) {
                edges { node { id availableForSale } }
              }
            }
          }`,
          { variables: { handle } },
        );

        const p = /** @type {any} */ (gqlResult).data?.product;
        if (!p) return null;

        const variantEdge = p.variants.edges[0];
        if (!variantEdge?.node?.availableForSale) return null;
        if (cartVariantIds.has(variantEdge.node.id)) return null;

        return {
          variantId: variantEdge.node.id,
          title: p.title,
          imageUrl: p.featuredImage?.url ?? item.mappings?.core?.imageUrl,
          imageAlt: p.featuredImage?.altText ?? p.title,
          price: parseFloat(p.priceRange.minVariantPrice.amount),
          currencyCode: p.priceRange.minVariantPrice.currencyCode,
        };
      }),
    );

    return resolved.filter(Boolean);
  }

  async function handleAdd(variantId) {
    setAddingId(variantId);
    try {
      await applyCartLinesChange({
        type: 'addCartLine',
        merchandiseId: variantId,
        quantity: 1,
      });
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setAddingId(null);
    }
  }

  if (isLoading) {
    return (
      <BlockStack spacing="base">
        {[...Array(2)].map((_, i) => (
          <View key={i} cornerRadius="base" padding="extraTight">
            <InlineLayout
              blockAlignment="center"
              spacing="base"
              columns={["auto", "fill", "auto"]}
            >
              <SkeletonImage inlineSize={60} blockSize={60} />
              <SkeletonTextBlock lines={3} />
              <SkeletonImage inlineSize={60} blockSize={40} />
            </InlineLayout>
          </View>
        ))}
      </BlockStack>
    );
  }

  if (products.length === 0) return null;

  return (
    <BlockStack spacing="base">
      <Text size="large" emphasis="bold">You might also like</Text>
      {products.map((product) => (
        <UpsellCard
          key={product.variantId}
          product={product}
          onAdd={handleAdd}
          adding={addingId === product.variantId}
        />
      ))}
    </BlockStack>
  );
}

function UpsellCard({ product, onAdd, adding }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currencyCode,
  }).format(product.price);

  return (
    <View cornerRadius="base">
      <InlineLayout
        blockAlignment="center"
        spacing="base"
        columns={["auto", "fill", "auto"]}
      >
        
          <View cornerRadius="base" maxInlineSize={75} maxBlockSize={75} overflow="hidden">
            {product.imageUrl && (
              <Image source={product.imageUrl} accessibilityDescription={product.imageAlt} fit="cover"/>
            )}
          </View>
        <BlockStack spacing="extraTight">
          <Text size="medium">{product.title}</Text>
          <Text size="small" emphasis="bold">{formattedPrice}</Text>
        </BlockStack>
        <Button
          onPress={() => onAdd(product.variantId)}
          disabled={adding}
          kind="primary"
        >
          {adding ? "Adding..." : "Add"}
        </Button>
      </InlineLayout>
    </View>
  );
}

function extractHandle(url) {
  if (!url) return null;
  const match = url.match(/\/products\/([^/?#]+)/);
  return match ? match[1] : null;
}
