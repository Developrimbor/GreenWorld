import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

// Bu ikon: Material Design Icons'dan 'recycle' (mdi:recycle)
// https://icon-sets.iconify.design/mdi/recycle/

const IconifyGlassIcon = ({ width = 32, height = 32, color = '#4B9363', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M13 20h5v2H6v-2h5v-6.03c-2.81-.27-5-2.63-5-5.51c0-.31.03-.61.08-.91L7 2h6.54l-1.21 2.41l-.54 1.09h2l-1.46 2.91l-.54 1.09H14l-1 3.25l2.67-3.66l.79-1.09h-2.25l1.46-2.91l.54-1.09h-2l1-2H17l.93 5.55c.07.3.07.6.07.91c0 2.88-2.19 5.24-5 5.51z" fill={color}/>
  </Svg>
);

export default IconifyGlassIcon; 