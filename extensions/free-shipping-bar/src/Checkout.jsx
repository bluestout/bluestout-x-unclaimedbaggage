import {
  reactExtension,
  Text,
  Heading,
  Image,
  BlockStack,
  Progress,
  Grid,
  useTotalAmount,
  View,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <FreeShippingBar />
));

function FreeShippingBar() {
  const totalAmount = useTotalAmount();
  const settings = useSettings();
  const FREE_SHIPPING_THRESHOLD = parseFloat(settings.shipping_threshold) || 100;
  const currentTotal = parseFloat(totalAmount?.amount || 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
  const progress = Math.min((currentTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const isEligible = remaining === 0;
  const message = isEligible
    ? "Congratulations! You've unlocked free shipping!"
    : `Almost there! Add $${remaining.toFixed(2)} to unlock`;

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
          source="https://cdn.shopify.com/s/files/1/0959/4214/8465/files/1_4eafbfb1-12fc-421b-add4-422a37133699.png?v=1760652293&width=30"
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