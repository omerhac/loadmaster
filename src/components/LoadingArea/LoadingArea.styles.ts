import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  tabletLoadingArea: {
    padding: 0,
  },
  landscapeLoadingArea: {
    flex: 3,
  },
  deckWrapper: {
    flex: 2,
  },
  stageAreaContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginTop: 5,
    position: 'relative',
    backgroundColor: '#ffffff',

  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  stageTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  stageItemCount: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
});
