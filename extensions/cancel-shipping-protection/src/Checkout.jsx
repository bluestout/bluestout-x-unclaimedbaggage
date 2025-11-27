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
      <TextBlock><Text appearance="subdued" size="small">Protect your order from: damage, loss,&nbsp;</Text>
        <TextBlock>
          <Text appearance="subdued" size="small">or theft&nbsp;
          </Text>
          <Text size="small">
            <Link appearance="accent" size="small" to="https://unclaimedbaggage.com/policies/shipping-policy" external >Learn more</Link>
          </Text>
        </TextBlock>
      </TextBlock>
      <Text size="small">
        <Link appearance="accent" onPress={handleRemove}>Cancel</Link>
      </Text>
    </View>
  )
}