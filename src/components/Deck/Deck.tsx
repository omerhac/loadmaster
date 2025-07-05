import React, { useCallback, useMemo } from 'react';
import { View, ImageBackground } from 'react-native';
import { CargoItem } from '../../types';
import { Images } from '../../assets';
import { styles } from './Deck.styles';
import DeckItem from './DeckItem';

interface DeckProps {
  items: CargoItem[];
  // Inner deck dimensions (in pixels) for child clamping
  deckSize: { width: number; height: number };
  // Deck absolute offset on screen for pointer repositioning
  deckOffset: { x: number; y: number };
  onRemoveFromDeck?: (id: string) => void;
  onUpdateItemStatus: (id: string, status: 'onStage' | 'onDeck' | 'inventory', position: { x: number, y: number }) => void;
}

const Deck: React.FC<DeckProps> = React.memo(({
  items,
  deckSize,
  deckOffset,
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
        resizeMode="contain"
      >
        {deckItems.map((item) => (
          <DeckItem
            key={item.id}
            item={item}
            deckSize={deckSize}
            deckOffset={deckOffset}
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
