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
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <FreeShippingBar />
));

function FreeShippingBar() {
  const subtotalAmount = useSubtotalAmount();
  const settings = useSettings();
  const FREE_SHIPPING_THRESHOLD = parseFloat(settings.shipping_threshold) || 100;
  const currentTotal = parseFloat(subtotalAmount?.amount || 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const progress = Math.min((currentTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const isEligible = remaining === 0;
  const message = isEligible
    ? "You’ve got FREE shipping! (U.S. Only)"
    : `You're $${remaining.toFixed(2)} away from getting free shipping`;

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
          <Heading level={2} size="small">FREE SHIPPING</Heading>
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