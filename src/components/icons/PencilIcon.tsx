import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PencilIcon = () => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
    <Path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25z" fill="white"/>
    <Path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="white"/>
    <Path d="M0 0h24v24H0z" fill="none"/>
  </Svg>
);

export default PencilIcon; 