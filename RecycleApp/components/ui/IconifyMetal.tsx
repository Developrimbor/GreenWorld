import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyMetalIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512" fill="none" {...props}>
    <Path d="M322.248 85.684L61.432 224.717l-41.145 109.94l7.233 3.85l153.673 81.8l308.495-164.215l-37.752-99.903zm119.035 95.187l25.11 66.45l-102.56 54.594L430.39 186.64l10.893-5.77zm-89.576 47.417L284.957 343.9l-41.67 22.182l72.195-118.62l36.225-19.175zM72.38 248.78l28.21 14.933l-54.012 54.012zm210.827 15.767L211.19 382.87l.26.16l-17.208 9.16l5.795-83.618zm-165.334 8.312l16.963 8.98l-60.445 60.445l-16.93-9.012zM181.42 306.9l-6.174 89.07l-54.1-28.798z" fill={color}/>
  </Svg>
  
);

export default IconifyMetalIcon;