import React, { useCallback, useMemo } from 'react';
import { View, ImageBackground } from 'react-native';
import { CargoItem, Position } from '../../types';
import { Images } from '../../assets';
import { styles } from './Deck.styles';
import DeckItem from './DeckItem';

interface DeckProps {
  items: CargoItem[];
  onDrop: (id: string, position: Position) => void;
  onRemoveFromDeck?: (id: string) => void;
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position?: { x: number, y: number }) => void;
}

const Deck: React.FC<DeckProps> = React.memo(({
  items,
  onRemoveFromDeck,
  onUpdateItemStatus,
}) => {
  const deckItems = useMemo(() =>
    items.filter((item) => item.status === 'onDeck'),
    [items]
  );

  const handleRemoveFromDeck = useCallback((id: string) => {
    if (onRemoveFromDeck) {
      onRemoveFromDeck(id);
    }
  }, [onRemoveFromDeck]);

  return (
    <View style={styles.deckContainer}>
      <ImageBackground
        source={Images.deck}
        style={styles.deck}
        resizeMode="cover"
      >
        {deckItems.map((item) => (
          <DeckItem
            key={item.id}
            item={item}
            onRemove={handleRemoveFromDeck}
            onUpdateItemStatus={onUpdateItemStatus}
          />
        ))}
      </ImageBackground>
    </View>
  );
});

Deck.displayName = 'Deck';

export default Deck;
