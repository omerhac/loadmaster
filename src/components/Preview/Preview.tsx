import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './Preview.styles';

interface PreviewProps {
  items: CargoItem[];
  onSave: (items: CargoItem[]) => void;
  onReturn: () => void;
}

const Preview: React.FC<PreviewProps> = React.memo(({
  items,
  onReturn,
}) => {
  const itemsOnDeck = useMemo(() =>
    items.filter(i => i.status === 'onDeck').length,
    [items]
  );

  const itemsOnStage = useMemo(() =>
    items.filter(i => i.status === 'onStage').length,
    [items]
  );

  const handleReturn = useCallback(() => {
    onReturn();
  }, [onReturn]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mission Preview</Text>
        <TouchableOpacity onPress={handleReturn} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Planning</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Preview functionality will be implemented soon.
        </Text>

        <Text style={styles.statsText}>
          {`Total Items: ${items.length}`}
        </Text>
        <Text style={styles.statsText}>
          {`Items on Deck: ${itemsOnDeck}`}
        </Text>
        <Text style={styles.statsText}>
          {`Items on Stage: ${itemsOnStage}`}
        </Text>
      </View>
    </View>
  );
});

Preview.displayName = 'Preview';

export default Preview;
