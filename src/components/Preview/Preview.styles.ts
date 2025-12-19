import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  // Two column layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  // Section styles
  section: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 12,
  },
  sectionHeader: {
    backgroundColor: '#FFE135',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  sectionContent: {
    padding: 0,
  },
  // Table row styles
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minHeight: 28,
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    minHeight: 28,
  },
  tableRowHighlight: {
    backgroundColor: '#FFE135',
  },
  // Cell styles
  labelCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  valueCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  valueCellCenter: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  valueText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  valueTextLarge: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  // Summary section
  summarySection: {
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  summaryCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  summaryCellLast: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  // Fuel distribution table
  fuelTable: {
    borderWidth: 1,
    borderColor: '#000',
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
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  fuelHeaderCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  fuelHeaderText: {
    fontSize: 11,
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
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  fuelCellLast: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  fuelText: {
    fontSize: 12,
    color: '#000',
  },
  // Cargo table
  cargoTable: {
    borderWidth: 1,
    borderColor: '#000',
  },
  cargoHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  cargoHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  cargoHeaderCellLast: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  cargoHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  cargoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cargoCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
  },
  cargoCellLast: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargoText: {
    fontSize: 11,
    color: '#000',
  },
  // Column widths for cargo table
  colName: { flex: 2.5 },
  colFs: { flex: 1 },
  colWeight: { flex: 1.2 },
  colIndex: { flex: 1.2 },
  // Empty state
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Flight info row (for header section)
  flightInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#fff',
  },
  flightInfoCell: {
    flex: 1,
    flexDirection: 'row',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  flightInfoCellLast: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  flightInfoLabel: {
    fontSize: 11,
    color: '#666',
    marginRight: 4,
  },
  flightInfoValue: {
    fontSize: 11,
    color: '#000',
    fontWeight: '600',
  },
  // Totals row
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFE135',
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
});
