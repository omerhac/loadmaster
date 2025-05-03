import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderColor: '#ddd',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  tabletSidebar: {
    height: '100%',
  },
  landscapeSidebar: {
    width: 280,
    height: '100%',
    flex: 1,
  },
  sortContainer: {
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortSelect: {
    flex: 1,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  sortSelectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    width: '100%',
  },
  sortSelectText: {
    color: '#333',
    fontSize: 12,
    marginRight: 5,
  },
  sortSelectArrow: {
    fontSize: 8,
    color: '#555',
  },
  sortDirectionButton: {
    marginLeft: 6,
    padding: 0,
    height: 28,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  sortDirectionText: {
    fontSize: 12,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  toggleLabel: {
    fontSize: 11,
    color: '#484848',
    marginLeft: 1,
  },
  itemsList: {
    flex: 1,
    padding: 6,
  },
  emptyState: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    padding: 10,
    fontSize: 12,
  },
  addButtonContainer: {
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  switchStyle: {
    transform: [{ scaleX: 0.65 }, { scaleY: 0.65 }],
    marginRight: -5,
  },
}); 