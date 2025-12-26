import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  // Top summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  summaryCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  summaryCellLast: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  // Two column layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
  },
  columnSmall: {
    flex: 0.7,
  },
  // Section styles
  section: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  sectionHeader: {
    backgroundColor: '#FFE135',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  // Weight table with index
  weightTable: {
    borderWidth: 0,
  },
  weightHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  weightHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  weightHeaderCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  weightHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  weightRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  weightRowHighlight: {
    backgroundColor: '#FFE135',
    borderBottomColor: '#000',
  },
  weightCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  weightCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 11,
    color: '#000',
  },
  weightTextBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  weightTextCenter: {
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
  },
  // Column widths for weight table
  colLabel: { flex: 2 },
  colWeight: { flex: 1 },
  colIndex: { flex: 1 },
  colCumulative: { flex: 1 },
  // Cargo table styles
  cargoTable: {
    borderWidth: 0,
  },
  cargoHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  cargoHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  cargoHeaderCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  cargoHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  cargoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cargoCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cargoCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargoText: {
    fontSize: 10,
    color: '#000',
  },
  cargoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 2,
    backgroundColor: '#fff',
    fontSize: 10,
    height: 22,
    width: '100%',
    textAlign: 'center',
  },
  // Column widths for cargo table
  colName: { flex: 1.8 },
  colFs: { flex: 0.8 },
  colCum: { flex: 1 },
  colAction: { width: 26 },
  // Fuel distribution table
  fuelTable: {
    borderWidth: 0,
  },
  fuelHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  fuelHeaderCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  fuelHeaderCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  fuelHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  fuelRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  fuelCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  fuelCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  fuelText: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
  },
  fuelInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 2,
    backgroundColor: '#fff',
    fontSize: 10,
    height: 22,
    width: '100%',
    textAlign: 'center',
  },
  // Input styles for editable mode
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 4,
    backgroundColor: '#fff',
    fontSize: 11,
    height: 26,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 2,
    backgroundColor: '#fff',
    fontSize: 10,
    height: 22,
    textAlign: 'center',
  },
  // Button styles
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    margin: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Empty state
  emptyState: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  // Form row for editable sections
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formLabel: {
    flex: 1,
    fontSize: 11,
    color: '#333',
  },
  formValue: {
    flex: 1,
  },
});
