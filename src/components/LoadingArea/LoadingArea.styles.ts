import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  tabletLoadingArea: {
    padding: 0,
  },
  landscapeLoadingArea: {
    flex: 3,
  },
  deckWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  stageAreaContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    position: 'relative',
    backgroundColor: '#ffffff',
    zIndex: 0,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  stageItemCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
