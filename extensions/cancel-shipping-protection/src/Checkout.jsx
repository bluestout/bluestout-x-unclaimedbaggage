import {
  reactExtension,
  Link,
  useApplyCartLinesChange,
  useCartLineTarget,
  useSettings,
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

  return <Link padding="tight" onPress={handleRemove}>Cancel</Link>
}