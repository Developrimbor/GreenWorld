import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyClothesIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512" fill="none" {...props}>
    <Path d="M133.3 33.41L77.89 47.25L34.6 148.3l33.29 22.2l27.46-54.9l17.05 4.9l-15.07 150.1H245.2l9.2-87.9l.9-8.1h4.5l-5.4-54.1l17.1-4.9l27.4 54.9l33.3-22.2l-43.3-101.05l-55.4-13.84c-5.5 3.87-12.2 6.21-19.5 7.95c-9.4 2.21-20 3.24-30.6 3.24s-21.2-1.03-30.6-3.24c-7.3-1.74-14-4.07-19.5-7.95M271.5 192.6l-1.5 14h178.8l-1.5-14zm-3.4 32l-26.7 254h62.7l46.5-216.9h17.6l46.5 216.9h62.7l-26.7-254z" fill={color}/>
  </Svg>
  
);

export default IconifyClothesIcon;