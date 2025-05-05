import React, { useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { CargoItem } from '../../types';
import { styles } from './Stage.styles';
import StageItem from './StageItem';

interface StageProps {
  items: CargoItem[];
  onRemoveFromStage: (id: string) => void;
  onAddToStage: (id: string) => void;
  onDragToDeck: (id: string, position: { x: number, y: number }) => void;
}

const Stage: React.FC<StageProps> = React.memo(({
  items,
  onRemoveFromStage,
  onDragToDeck,
}) => {
  const stageItems = useMemo(() =>
    items.filter(item => item.status === 'onStage'),
    [items]
  );

  const handleRemoveFromStage = useCallback((id: string) => {
    onRemoveFromStage(id);
  }, [onRemoveFromStage]);

  const handleDragToDeck = useCallback((id: string, position: { x: number, y: number }) => {
    onDragToDeck(id, position);
  }, [onDragToDeck]);

  return (
    <View style={styles.stageContainer}>
      <View style={styles.stageItems}>
        {stageItems.map(item => (
          <StageItem
            key={item.id}
            item={item}
            onRemove={handleRemoveFromStage}
            onDragToDeck={handleDragToDeck}
          />
        ))}

        {stageItems.length === 0 && (
          <Text style={styles.emptyMessage}>
            No items in staging area
          </Text>
        )}
      </View>
    </View>
  );
});

Stage.displayName = 'Stage';

export default Stage;
