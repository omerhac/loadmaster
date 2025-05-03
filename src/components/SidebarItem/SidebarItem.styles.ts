import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  inInventory: {
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  onStage: {
    borderLeftWidth: 3,
    borderLeftColor: '#4fc08d',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  menuButton: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 4,
  },
  compactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  itemDimensions: {
    fontSize: 10,
    color: '#666',
  },
  itemWeight: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  actionButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  actionButtonRemoveText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  itemDetails: {
    padding: 5,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 10,
    color: '#555',
    width: 45,
  },
  detailValue: {
    fontSize: 10,
    color: '#333',
    flex: 1,
  },
}); 