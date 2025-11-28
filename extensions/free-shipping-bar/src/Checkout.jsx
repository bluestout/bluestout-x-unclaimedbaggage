import {
  reactExtension,
  Text,
  Heading,
  Image,
  BlockStack,
  Progress,
  Grid,
  useSubtotalAmount,
  View,
  useSettings,
  useCartLines,
  useApi,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <FreeShippingBar />
));

function FreeShippingBar() {
  const subtotalAmount = useSubtotalAmount();
  const cartLines = useCartLines();
  const settings = useSettings();
  const api = useApi();
  const [productTags, setProductTags] = useState({});
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const FREE_SHIPPING_THRESHOLD = parseFloat(settings.shipping_threshold) || 100;
  useEffect(() => {
    async function fetchProductTags() {
      const productIds = cartLines
        .map(line => line.merchandise?.product?.id)
        .filter(Boolean);
      
      if (productIds.length === 0) {
        setIsLoadingTags(false);
        return;
      }

      // Check which product IDs we don't have tags for yet
      const missingProductIds = productIds.filter(id => !(id in productTags));
      
      // If all products already have tags loaded, no need to fetch
      if (missingProductIds.length === 0) {
        setIsLoadingTags(false);
        return;
      }

      setIsLoadingTags(true);

      try {
        const tagPromises = missingProductIds.map(async (productId) => {
          const query = `
            query getProductTags($id: ID!) {
              product(id: $id) {
                id
                tags
              }
            }
          `;
          const result = await api.query(query, { variables: { id: productId } });
          return result;
        });

        const results = await Promise.all(tagPromises);
        const newTagsMap = {};
        results.forEach(result => {
          if (result?.data?.product) {
            newTagsMap[result.data.product.id] = result.data.product.tags || [];
          }
        });

        // Merge with existing tags
        setProductTags(prev => ({ ...prev, ...newTagsMap }));
        setIsLoadingTags(false);
      } catch (error) {
        console.error("Error fetching product tags:", error);
        setIsLoadingTags(false);
      }
    }
    fetchProductTags();
  }, [cartLines, api]);
  const allTagsLoaded = cartLines.every(line => {
    const productId = line.merchandise?.product?.id;
    return !productId || productId in productTags;
  });
  const adjustedSubtotal = allTagsLoaded 
    ? cartLines.reduce((total, line) => {
        const productId = line.merchandise?.product?.id;
        const tags = productTags[productId] || [];
        const hasShippingProtectionTag = tags.includes("shipping-protection-product");
        if (!hasShippingProtectionTag) {
          const lineTotal = parseFloat(line.cost?.totalAmount?.amount || 0);
          return total + lineTotal;
        }
        return total;
      }, 0)
    : parseFloat(subtotalAmount?.amount || 0);
    
  const currentTotal = adjustedSubtotal;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const progress = Math.min((currentTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const isEligible = remaining === 0;
  const message = isEligible
    ? "Congrats! This order qualifies for free shipping."
    : `You're $${remaining.toFixed(2)} away from getting free shipping`;
  const title = isEligible
    ? "Free Shipping Unlocked!"
    : "Unlock Free Shipping";


  return (
    <Grid
      columns={["auto", "fill"]}
      spacing="base"
      blockAlignment="center"
      background="subdued"
      padding="base"
      cornerRadius="base"
    >
      <View padding="base">
        <Image
          source="https://cdn.shopify.com/s/files/1/0959/4214/8465/files/free_shipping.png?v=1761251317&width=50"
          fit="contain"
        />
      </View>
      <BlockStack spacing="tight">
        <View spacing="tight">
          <Heading level={2} size="small">{title}</Heading>
          <Text emphasis="italic" size="small">{message}</Text>
        </View>
        <Progress
          value={progress}
          max={100}
          tone="auto"
        />
      </BlockStack>
    </Grid>
  );
}