import {
  reactExtension,
  useCartLineTarget,
  useCartLines,
  useApi,
  Badge,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.cart-line-item.render-after',
  () => <Extension />,
);

function Extension() {
  const { merchandise } = useCartLineTarget();
  const cartLines = useCartLines();
  const { query } = useApi();
  const [productTagsMap, setProductTagsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllProductTags() {
      try {
        const productIds = [...new Set(cartLines.map(line => line.merchandise.product.id))];
        const tagPromises = productIds.map(async (productId) => {
          const { data } = await query(
            `query($id: ID!) {
              product(id: $id) {
                id
                tags
              }
            }`,
            {
              variables: { id: productId },
            }
          );
          return data?.product;
        });

        const products = await Promise.all(tagPromises);
        const tagsMap = {};
        products.forEach(product => {
          if (product) {
            tagsMap[product.id] = product.tags || [];
          }
        });

        setProductTagsMap(tagsMap);
      } catch (error) {
        console.error('Error fetching product tags:', error);
      } finally {
        setLoading(false);
      }
    }

    if (cartLines.length > 0) {
      fetchAllProductTags();
    }
  }, [cartLines, query]);

  const currentProductId = merchandise.product.id;
  const currentProductTags = productTagsMap[currentProductId] || [];
  const hasFinalSaleTag = currentProductTags.includes('Final Sale_Not Eligible for Returns');

  if (loading || !hasFinalSaleTag) {
    return null;
  }

  return (
    <Badge size="base">Final Sale</Badge>
  );
}