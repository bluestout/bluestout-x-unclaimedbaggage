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
  useSettings,
  Image,
  View,
  Button
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query } = useApi();
  const cartItems = useCartLines();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [product, setProduct] = useState(null);
  const settings = useSettings();
  const applyCartLineChange = useApplyCartLinesChange();
  const isInCart = cartItems.some(item =>
    item.merchandise.id === settings.pack_protection_product
  );

  useEffect(() => {
    if (!isInCart) {
      fetchProductData();
      setIsAdded(false);
    } else {
      setIsLoading(false);
    }
  }, [isInCart]);

  async function fetchProductData() {
    setIsLoading(true);
    try {
      const { data } = await query(`{
        node(id: "${settings.pack_protection_product}") {
          ... on ProductVariant {
            id
            title
            price {
              amount
              currencyCode
            }
            product {
              title
            }
          }
        }
      }`);

      if (data?.node) {
        setProduct(data.node);
      }
    } catch (error) {
      console.error("Error fetching shipping protection:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addProtection() {
    if (!product) return;

    setIsAdding(true);
    try {
      await applyCartLineChange({
        type: "addCartLine",
        merchandiseId: product.id,
        quantity: 1,
        attributes: [
          {
            key: "Protect your order from",
            value: "damage, loss, or theft"
          }
        ]
      });
      setIsAdded(true);
    } catch (error) {
      console.error("Error adding protection:", error);
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading) {
    return (
      <View
        cornerRadius="base"
        padding="extraTight"
      >
        <InlineLayout
          blockAlignment="center"
          spacing="base"
          columns={["auto", "fill", "auto"]}
        >
          <SkeletonImage
            inlineSize={60}
            blockSize={60}
          />
          <SkeletonTextBlock lines={3} />
          <SkeletonImage
            inlineSize={60}
            blockSize={40}
          />
        </InlineLayout>
      </View>
    );
  }

  if (!product || isInCart || isAdded) {
    return null;
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.price.currencyCode,
  }).format(parseFloat(product.price.amount));

  return (
    <View
      cornerRadius="base"
      padding="extraTight"
      backgroundColor="base"
    >
      <InlineLayout
        blockAlignment="center"
        spacing="base"
        columns={["auto", "fill", "auto"]}
      >
        {/* Icon Section */}
        <View
          padding="extraTight"
          cornerRadius="small"
          backgroundColor="subdued"
        >
          <Image source="https://cdn.shopify.com/s/files/1/0259/9469/0645/files/Group_912_030ab33c-69ee-4f0b-861b-5ef11fa55689.png?v=1764010492&width=60" fit="contain" />
        </View>

        {/* Content Section */}
        <BlockStack spacing="extraTight">
          <Text size="medium" emphasis="bold">
            Shipping Protection
          </Text>
          <Text size="small" appearance="subdued">
            Protect your order from damage, loss, or theft
          </Text>
          <Text size="small" emphasis="bold">
            {formattedPrice}
          </Text>
        </BlockStack>

        {/* Button Section */}
        <Button
          onPress={addProtection}
          disabled={isAdding}
          kind="primary"
        >
          {isAdding ? "Adding..." : "Add"}
        </Button>
      </InlineLayout>
    </View>
  );
}