import {
  reactExtension,
  Link,
  useApplyCartLinesChange,
  useCartLineTarget,
  useSettings,
  Text,
  View,
  TextBlock,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.cart-line-item.render-after',
  () => <Extension />,
);

function Extension() {
  const applyCartLinesChange = useApplyCartLinesChange();
  const {
    id, quantity, merchandise
  } = useCartLineTarget();
  const settings = useSettings();
  const packProtectionVariantId = settings.pack_protection_product;

  if (!packProtectionVariantId || merchandise?.id !== packProtectionVariantId) {
    return null;
  }

  const handleRemove = async () => {
    await applyCartLinesChange({
      type: 'removeCartLine',
      id: id,
      quantity: quantity,
    });
  };

  return (
    <View>
      <TextBlock><Text appearance="subdued" size="small">Protect your order from damage, loss, or theft </Text>
      </TextBlock>
      <Text size="small">
        <Link appearance="accent" onPress={handleRemove}>Remove</Link>
      </Text>
    </View>
  )
}