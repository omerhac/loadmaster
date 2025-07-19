import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 50 : 45,
    zIndex: 100,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  burgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerButtons: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  graphsButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    // backgroundColor: '#444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphsButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  metricContainer: {
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  firstMetric: {
    marginLeft: 0,
  },
  metricLabel: {
    color: '#bbb',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 1,
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertLabel: {
    color: '#ffcccc',
  },
  alertValue: {
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
